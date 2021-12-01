var departements = require('./departement_from_api.json')
const depatementsRef = departements.map((departement) => ({code: departement.code, libelle: departement.libelle}))
const fs = require('fs')

fs.writeFile('./departements.json', JSON.stringify(depatementsRef), err => {
  if (err) {
    console.error(err)
    return
  }
})

