const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres'
})

const referentiel_agences_milo = require('./referentiel_agences_api_milo_copy.json')

async function execute() {
  const [agencesCej, _metadata] = await sequelize.query(`
            SELECT * FROM structure_milo
  `)

  let agencesNonCejReferentiel = await recupererLesAgencesSansConseillersCej(
    agencesCej
  )
  ajouterLesInformationsGeographiques(agencesNonCejReferentiel, agencesCej)
  await persisterLesAgencesSansConseillersCej(agencesNonCejReferentiel)
  await persisterLeNomUsuelDansLesAgencesCej(agencesCej)
}

execute()

async function recupererLesAgencesSansConseillersCej(agencesCej) {
  return referentiel_agences_milo
    .map(agenceMilo => {
      return {
        id: agenceMilo.codeStructure,
        nom_officiel: agenceMilo.nomOfficiel,
        nom_usuel: agenceMilo.nomUsuel,
        adresse: agenceMilo.adresse
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
    const departement = agenceNonCej.adresse.codePostal.slice(0, 2)
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

async function persisterLesAgencesSansConseillersCej(agencesNonCejReferentiel) {
  await sequelize.transaction(async transaction => {
    for (let agenceNonCej of agencesNonCejReferentiel) {
      await sequelize.query(
        `
            INSERT INTO agence (id, nom_agence, nom_region, code_departement, structure, code_region, nom_departement, timezone, nom_usuel)
            VALUES ('${agenceNonCej.id}', '${agenceNonCej.nom_officiel}', '${agenceNonCej.nomRegion}', '${agenceNonCej.codeDepartement}', 'MILO', '${agenceNonCej.codeRegion}', '${agenceNonCej.nomDepartement}', '${agenceNonCej.timezone}', '${agenceNonCej.nom_usuel}');`,
        {
          transaction
        }
      )
      await sequelize.query(
        `
            INSERT INTO structure_milo (id, nom_officiel, nom_usuel, nom_region, code_region, nom_departement, code_departement, timezone)
            VALUES ('${agenceNonCej.id}', '${agenceNonCej.nom_officiel}', '${agenceNonCej.nom_usuel}', '${agenceNonCej.nomRegion}', '${agenceNonCej.codeRegion}', '${agenceNonCej.nomDepartement}', '${agenceNonCej.codeDepartement}', '${agenceNonCej.timezone}');`,
        {
          transaction
        }
      )
    }
  })
}

async function persisterLeNomUsuelDansLesAgencesCej(agencesCej) {
  await sequelize.transaction(async transaction => {
    for (let agenceCej of agencesCej) {
      await sequelize.query(
        `UPDATE agence SET nom_usuel = '${agenceCej.nom_usuel}' WHERE id = '${agenceCej.id}';`,
        { transaction }
      )
    }
  })
}
