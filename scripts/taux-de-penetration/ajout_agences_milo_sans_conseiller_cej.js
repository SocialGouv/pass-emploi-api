const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres'
})

const referentiel_agences_milo =
  require('./referentiel_agences_api_milo.json').Sheet1

async function execute() {
  const [agencesCej, _metadata] = await sequelize.query(`
            SELECT * FROM structure_milo
  `)

  /*let agencesNonCejReferentiel = await recupererLesAgencesSansConseillersCej(
    agencesCej
  )
  ajouterLesInformationsGeographiques(agencesNonCejReferentiel, agencesCej)*/
  await sequelize.transaction(async transaction => {
    /*await persisterLesAgencesSansConseillersCej(
      agencesNonCejReferentiel,
      transaction
    )*/
    await persisterLeNomUsuelDansLesAgencesCej(agencesCej, transaction)
  })
}

execute()

async function recupererLesAgencesSansConseillersCej(agencesCej) {
  return referentiel_agences_milo
    .map(agenceMilo => {
      return {
        id: agenceMilo['Code structure'] + 'S00',
        nom_officiel: agenceMilo['Nom officiel structure'],
        nom_usuel: agenceMilo['Nom usuel structure']
      }
    })
    .filter(
      agenceMilo => !agencesCej.map(agence => agence.id).includes(agenceMilo.id)
    )
}

function ajouterLesInformationsGeographiques(
  agencesNonCejReferentiel,
  agencesCej
) {
  for (let agenceNonCej of agencesNonCejReferentiel) {
    const departement = agenceNonCej['Code département']
    const autreAgencesCejMemeDepartement = agencesCej.find(
      agenceCej => agenceCej.code_departement === departement
    )

    if (autreAgencesCejMemeDepartement) {
      agenceNonCej.codeRegion = autreAgencesCejMemeDepartement.code_region
      agenceNonCej.nomRegion = autreAgencesCejMemeDepartement.nom_region
      agenceNonCej.codeDepartement = departement
      agenceNonCej.nomDepartement =
        autreAgencesCejMemeDepartement.nom_departement
      agenceNonCej.timezone = autreAgencesCejMemeDepartement.timezone
    } else {
      agenceNonCej.codeRegion = '-'
      agenceNonCej.nomRegion = 'Structure régionale -'
      agenceNonCej.codeDepartement = departement
      agenceNonCej.nomDepartement = 'Structure départementale -'
      agenceNonCej.timezone = '-'
    }
  }
}

async function persisterLesAgencesSansConseillersCej(
  agencesNonCejReferentiel,
  transaction
) {
  for (let agenceNonCej of agencesNonCejReferentiel) {
    await sequelize.query(
      `
            INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure, code_region, nom_departement, timezone, nom_usuel)
            VALUES agence (:id, :nom_agence, :nom_region, :code_departement, 'MILO', :code_region, :nom_departement, :timezone, :nom_usuel);`,
      {
        replacements: {
          id: agenceNonCej.id,
          nom_agence: agenceNonCej.nom_officiel,
          nom_region: agenceNonCej.nomRegion,
          code_departement: agenceNonCej.codeDepartement,
          code_region: agenceNonCej.codeRegion,
          nom_departement: agenceNonCej.nomDepartement,
          timezone: agenceNonCej.timezone,
          nom_usuel: agenceNonCej.nomUsuel
        },
        transaction
      }
    )
    await sequelize.query(
      `
            INSERT INTO structure_milo (id, nom_officiel, nom_usuel, nom_region, code_region, nom_departement, code_departement, timezone)
            VALUES structure_milo (:id, :nom_officiel, :nom_usuel, :nom_region, :code_region, :nom_departement, :code_departement, :timezone);`,
      {
        replacements: {
          id: agenceNonCej.id,
          nom_officiel: agenceNonCej.nom_officiel,
          nom_usuel: agenceNonCej.nom_usuel,
          nom_region: agenceNonCej.nomRegion,
          code_region: agenceNonCej.codeRegion,
          nom_departement: agenceNonCej.nomDepartement,
          code_departement: agenceNonCej.codeDepartement,
          timezone: agenceNonCej.timezone
        },
        transaction
      }
    )
  }
}

async function persisterLeNomUsuelDansLesAgencesCej(agencesCej, transaction) {
  for (let agenceCej of agencesCej) {
    await sequelize.query(`UPDATE agence SET nom_usuel = ? WHERE id = ?;`, {
      replacements: [agenceCej.nom_usuel, agenceCej.id],
      transaction
    })
  }
}
