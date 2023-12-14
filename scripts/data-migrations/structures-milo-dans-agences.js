require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  'postgres://pa_back_sta_7106:gJln4m9jpfd5x7-01O1E@127.0.0.1:10000/pa_back_sta_7106',
  {
    dialect: 'postgres'
  }
)

async function execute() {
  await sequelize.transaction(async transaction => {
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
        `INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure, code_region, nom_departement, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nom_agence = ?`,
        {
          replacements: [
            structureMilo.id,
            structureMilo.nom_officiel,
            structureMilo.nom_region ?? 'INCONNU',
            structureMilo.code_departement ?? '99',
            'MILO',
            structureMilo.code_region ?? null,
            structureMilo.nom_departement ?? null,
            structureMilo.timezone,
            structureMilo.nom_officiel
          ],
          transaction
        }
      )
    }
  })

  await sequelize.transaction(async transaction => {
    // Rattacher les conseillers MILO avec des Agences CEJ qui sont maintenant des structures Milo
    await sequelize.query(
      `UPDATE conseiller SET id_agence = id_structure_milo WHERE structure = 'MILO' AND id_agence != '9999'`,
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

    // Supprimer les inscriptions des jeunes aux ACs qui ne sont pas de leur structure
    await sequelize.query(`DELETE FROM rendez_vous_jeune_association WHERE id IN (SELECT rendez_vous_jeune_association.id FROM rendez_vous_jeune_association, jeune, rendez_vous 
      WHERE rendez_vous.id_agence IS NOT null
      AND rendez_vous.id = rendez_vous_jeune_association.id_rendez_vous
      AND rendez_vous_jeune_association.id_jeune = jeune.id 
      AND jeune.structure = 'MILO'
      AND jeune.id_structure_milo != rendez_vous.id_agence)`)

    // Supprimer les anciennes Agences
    await sequelize.query(`DELETE FROM agence WHERE nom_agence = 'A_SUPPR'`, {
      transaction
    })
  })
}

execute()
