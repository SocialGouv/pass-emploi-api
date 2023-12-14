require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

sequelize.transaction(async transaction => {
  // Uniformiser les code departement
  await sequelize.query(
    `UPDATE agence SET code_departement = '01' WHERE code_departement = '1'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '02' WHERE code_departement = '2'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '03' WHERE code_departement = '3'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '04' WHERE code_departement = '4'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '05' WHERE code_departement = '5'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '06' WHERE code_departement = '6'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '07' WHERE code_departement = '7'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '08' WHERE code_departement = '8'`,
    {
      transaction
    }
  )
  await sequelize.query(
    `UPDATE agence SET code_departement = '09' WHERE code_departement = '9'`,
    {
      transaction
    }
  )

  // Marquer les agences à supprimer
  await sequelize.query(
    `UPDATE agence SET nom_agence = 'A_SUPPR' WHERE structure = 'MILO' AND id != '9999'`,
    {
      transaction
    }
  )

  // Remplir table Agence par Structures Milo
  const structuresMiloRaw = await sequelize.query(
    `SELECT * FROM structure_milo`,
    {
      transaction
    }
  )

  for (const structureMilo of structuresMiloRaw[0]) {
    await sequelize.query(
      `INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure, code_region, nom_departement, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          structureMilo.id,
          structureMilo.nom_officiel,
          structureMilo.nom_region ?? 'INCONNU',
          structureMilo.code_departement ?? '99',
          'MILO',
          structureMilo.code_region,
          structureMilo.nom_departement,
          structureMilo.timezone
        ],
        transaction
      }
    )
  }

  // Detacher les conseillers MILO de leurs Agence CEJ
  await sequelize.query(
    `UPDATE conseiller SET id_agence = NULL WHERE structure = 'MILO'`,
    {
      transaction
    }
  )
  // Rattacher les conseillers MILO avec des Agences CEJ qui sont maintenant des structures Milo
  await sequelize.query(
    `UPDATE conseiller SET id_agence = id_structure_milo WHERE structure = 'MILO'`,
    {
      transaction
    }
  )

  // Rattacher les ACs aux Agences de leurs créateurs (qui sont maintenant des structures Milo)

  // 1. Détacher les ACs des anciennes agences
  await sequelize.query(
    `UPDATE rendez_vous SET id_agence = NULL WHERE rendez_vous.type = 'ATELIER' OR rendez_vous.type = 'INFORMATION_COLLECTIVE'`
  )

  // 2. Récupérer les ACs pour leur rajouter le nouvel id Agence de leur créateur (qui est maintenant un id structure)
  const ACsRAW = await sequelize.query(
    `SELECT * FROM rendez_vous WHERE rendez_vous.type = 'ATELIER' OR rendez_vous.type = 'INFORMATION_COLLECTIVE'`
  )
  const ACs = ACsRAW[0]
  for (const AC of ACs) {
    const conseillerRaw = await sequelize.query(
      `SELECT conseiller.id_agence AS id_agence FROM conseiller WHERE conseiller.id = '${AC.createur.id}'`,
      { transaction }
    )
    const idAgence = conseillerRaw[0][0].id_agence

    if (idAgence)
      await sequelize.query(
        `UPDATE rendez_vous SET id_agence = '${idAgence}' WHERE rendez_vous.id = '${AC.id}'`
      )
  }

  // 3. soft delete des ACs dont les conseillers n'ont pas d'agence / structure Milo
  await sequelize.query(
    `UPDATE rendez_vous SET date_suppression = NOW() WHERE (rendez_vous.type = 'ATELIER' OR rendez_vous.type = 'INFORMATION_COLLECTIVE') AND rendez_vous.id_agence IS NULL`
  )

  // Supprimer les anciennes Agences
  await sequelize.query(`DELETE FROM agence WHERE nom_agence = 'A_SUPPR'`, {
    transaction
  })
})
