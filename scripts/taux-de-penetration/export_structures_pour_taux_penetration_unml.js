const structuresReferentielUnml = require('./referentiel_unml.json').Sheet1
const structuresAvecAuMoinsUnConseillerUtilisateurCej = require('./structures_cej_avec_conseillers_utilisateurs.json')

const fs = require('fs')

async function exportStructuresPourTauxPenetration() {
  const result = []

  for (const structureUnml of structuresReferentielUnml) {
    let structureTmp = {}
    enrichirAvecLesInformationsDeStructure(structureTmp, structureUnml)
    enrichirAvecLeNombreDeConseillersUtilisateursDuCEJ(structureTmp)
    enrichirAvecLesInformationsGeographiques(structureTmp, structureUnml)
    result.push(structureTmp)
  }

  result.sort((structure1, structure2) => {
    return structure1.structure_id < structure2.structure_id ? -1 : 1
  })

  fs.writeFile(
    './structures_pour_taux_penetration.json',
    JSON.stringify(result),
    err => {
      console.log(err)
    }
  )
}

function enrichirAvecLesInformationsDeStructure(structureTmp, structureUnml) {
  structureTmp.structure_id = structureUnml['Code structure'] + 'S00'
  structureTmp.nom_officiel = structureUnml['Nom officiel structure']
  structureTmp.nom_usuel = structureUnml['Nom usuel structure']
}

function enrichirAvecLeNombreDeConseillersUtilisateursDuCEJ(structureTmp) {
  const structureAvecConseillerCej =
    structuresAvecAuMoinsUnConseillerUtilisateurCej.find(
      structureCej => structureTmp.structure_id === structureCej.structure_id
    )
  if (structureAvecConseillerCej) {
    structureTmp.nb_conseillers_cej = structureAvecConseillerCej.count
  } else {
    structureTmp.nb_conseillers_cej = 0
  }
}

function enrichirAvecLesInformationsGeographiques(structureTmp, structureUnml) {
  const structureAvecConseillerCej =
    structuresAvecAuMoinsUnConseillerUtilisateurCej.find(
      structureCej => structureTmp.structure_id === structureCej.structure_id
    )

  structureTmp.code_departement = structureUnml['Code département']

  if (structureAvecConseillerCej) {
    structureTmp.nom_departement =
      structureAvecConseillerCej.nom_departement
    structureTmp.code_region = structureAvecConseillerCej.code_region
    structureTmp.nom_region = structureAvecConseillerCej.nom_region
  } else {
    structureTmp.nom_departement = 'Structure départementale -'
    structureTmp.code_region = '-'
    structureTmp.nom_region = 'Structure régionale -'
  }
}

exportStructuresPourTauxPenetration()
