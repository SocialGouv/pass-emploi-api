const structuresReferentielUnml = require('./referentiel_unml.json').Sheet1
const idsStructuresReferentielUnml = structuresReferentielUnml.map(
  structure => structure['Code structure'] + 'S00'
)

const structuresAvecAuMoinsUnConseillerUtilisateur = require('./structures_cej_avec_conseillers_utilisateurs.json')
const idsStructuresAvecAuMoinsUnConseillerUtilisateur =
  structuresAvecAuMoinsUnConseillerUtilisateur.map(
    structure => structure.structure_id
  )

const fs = require('fs')

async function exportStructuresPourTauxPenetration() {
  const result = []

  for (let i = 0; i < idsStructuresReferentielUnml.length; i++) {
    let structureAvecAuMoinsUnConseillerUtilisateur =
      idsStructuresAvecAuMoinsUnConseillerUtilisateur.includes(
        idsStructuresReferentielUnml[i]
      )

    if (structureAvecAuMoinsUnConseillerUtilisateur) {
      result.push(
        structuresAvecAuMoinsUnConseillerUtilisateur.find(
          structure =>
            structure.structure_id === idsStructuresReferentielUnml[i]
        )
      )
    } else {
      result.push({
        structure_id: structuresReferentielUnml[i]['Code structure'] + 'S00',
        nom_region: 'Structure régionale -',
        nom_departement: 'Structure départementale -',
        code_departement: structuresReferentielUnml[i]['Code département'],
        nom_officiel: structuresReferentielUnml[i]['Nom officiel structure'],
        nom_usuel: structuresReferentielUnml[i]['Nom usuel structure'],
        count: 0
      })
    }
  }

  result.sort((structure1, structure2) => {
    return structure1.code_departement < structure2.code_departement ? -1 : 1
  })

  fs.writeFile(
    './structures_pour_taux_penetration.json',
    JSON.stringify(result),
    err => {
      console.log(err)
    }
  )
}

exportStructuresPourTauxPenetration()
