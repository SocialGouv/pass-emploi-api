const fs = require('fs')
const metiersRomeJson = require('../src/infrastructure/sequelize/seeders/data/metiers-rome.json')

let newMetiersRomeReferentiel = []

fs.readFile('./ROME_ArboPrincipale.csv', function (err, csv) {
  if (err) {
    return console.log(err)
  }

  const bufferString = csv.toString()
  const csvLines = bufferString.split('\n')
  const headers = csvLines[0].split(';')

  const metierRomeJsonMap = metiersRomeJson.reduce((map, metier) => {
    if (metier.libelle) map.set(metier.libelle, metier)
    return map
  }, new Map())

  const length = csvLines.length
  //const length = 10

  for (let i = 1; i < length; i++) {
    let libelleAppellation = csvLines[i].split(';')
    let obj = {}
    for (let j = 0; j < libelleAppellation.length; j++) {
      obj[headers[j].trim()] = libelleAppellation[j].trim()
    }

    if (metierRomeJsonMap.get(obj.libelle)) {
      newMetiersRomeReferentiel.push({
        ...metierRomeJsonMap.get(obj.libelle),
        appellation_code: obj.appellation_code
      })
    }
  }

  console.log(newMetiersRomeReferentiel)

  fs.writeFile(
    '../src/infrastructure/sequelize/seeders/data/metiers-rome.json',
    JSON.stringify(newMetiersRomeReferentiel),
    error => {
      console.error(error)
    }
  )
})
