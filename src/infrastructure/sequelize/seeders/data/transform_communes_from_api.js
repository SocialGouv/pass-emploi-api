var communes = require('./communes_from_api.json')
const communesRef = communes.map((commune) => (
  {id: `${commune.code}-${commune.codePostal}`, code: commune.code, libelle: commune.libelle, code_postal: commune.codePostal, code_departement: commune.codeDepartement}
))
const fs = require('fs')

fs.writeFile('./communes.json', JSON.stringify(communesRef), err => {
  if (err) {
    console.error(err)
    return
  }
})

