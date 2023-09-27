const fs = require('fs')
const metiersRome = require('../src/infrastructure/sequelize/seeders/data/metiers-rome.json')

fs.readFile('./ROME_ArboPrincipale.csv', function (err, csv) {
  if (err) {
    return console.log(err)
  }

  const bufferString = csv.toString()
  const csvLines = bufferString.split('\n')

  const headers = csvLines[0].split(';')
  let newMetiersRome = []

  for (let i = 1; i < csvLines.length; i++) {
    let libelleAppellation = csvLines[i].split(';')
    let obj = {}
    for (let j = 0; j < libelleAppellation.length; j++) {
      obj[headers[j].trim()] = libelleAppellation[j].trim()
    }
    if (obj.appellation_code !== '') {
      metiersRome.find(item => item.libelle === obj.libelle)
    }
  }
})
