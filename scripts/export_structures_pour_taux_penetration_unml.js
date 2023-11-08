// Import du référentiel de structures tel qu'envoyé par l'UNML
const referentiel_unml = require('./referentiel_unml.json')
const liste_structures_unml = referentiel_unml.Sheet1
const liste_ids_structures = liste_structures_unml.map(
  structure => structure['Code structure'] + 'S00'
)

// Import des résultats de la requête Metabase
// https://stats.pass-emploi.beta.gouv.fr/question/373-nb-de-conseillers-milo-utilisateurs-dernier-ae-2-mois-par-structure
const structures_avec_conseiller_actif = require('./referentiel_unml_avec_activite.json')
const ids_structures_avec_conseiller_actif =
  structures_avec_conseiller_actif.map(structure => structure.structure_id)

const fs = require('fs')

async function exportStructuresPourTauxPenetration() {
  const structuresPourExportTauxPenetration = []

  for (let i = 0; i < liste_ids_structures.length; i++) {
    let structureAvecActivite = ids_structures_avec_conseiller_actif.includes(
      liste_ids_structures[i]
    )

    if (structureAvecActivite) {
      structuresPourExportTauxPenetration.push(
        structures_avec_conseiller_actif.find(
          structure => structure.structure_id === liste_ids_structures[i]
        )
      )
    } else {
      structuresPourExportTauxPenetration.push({
        structure_id: liste_structures_unml[i]['Code structure'] + 'S00',
        nom_region: 'Structure régionale -',
        nom_departement: 'Structure départementale -',
        code_departement: liste_structures_unml[i]['Code département'],
        nom_officiel: liste_structures_unml[i]['Nom officiel structure'],
        nom_usuel: liste_structures_unml[i]['Nom usuel structure'],
        count: 0
      })
    }
  }

  structuresPourExportTauxPenetration.sort((structure1, structure2) => {
    return structure1.code_departement < structure2.code_departement ? -1 : 1
  })

  fs.writeFile(
    './structures_pour_taux_penetration.json',
    JSON.stringify(structuresPourExportTauxPenetration),
    err => {
      console.log(err)
    }
  )
}

exportStructuresPourTauxPenetration()
