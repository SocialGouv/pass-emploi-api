/* eslint-disable no-console */
import { readFile, writeFile } from 'fs/promises'
import fetch from 'node-fetch'

let communesManquantesJson = []
try {
  communesManquantesJson = await readFile(
    './communes_manquantes.json'
  )
} catch (err) {
  console.error(err)
  process.exit()
}

const communesManquantes = JSON.parse(communesManquantesJson);

const dictionnaryCommunesManquantes = communesManquantes.reduce(
  function(acc, currentData) {
  acc[currentData.id] = currentData;
  return acc;},[]);

const start = new Date()
console.log('STARTED', start)
let communesJson = []
try {
  communesJson = await readFile(
    '../src/infrastructure/sequelize/seeders/data/communes_from_api.json'
  )
} catch (err) {
  console.error(err)
  process.exit()
}

const communes = JSON.parse(communesJson)
const total = communes.length

const communesReferentiel = []
let count = 1,
  failed = 0
console.log('# Parsing communes from data gouv')
for await (const commune of communes) {
  console.log(
    `# parsed ${count}/${total} ${failed ? `(${failed} failed)` : ''}`
  )
  console.log(`## parsing ${commune.libelle}`)
  console.log(`### fetching data gouv...`)
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${commune.libelle}&postcode=${commune.codePostal}&type=municipality`
  )
  console.log('...data gouv fetched')
  if (!response.ok) {
    console.log('/!\\ response not ok')
    failed++
    continue
  }

  const data = await response.json()
  if (!data?.features.length) {
    console.log(commune.code + "-" + commune.codePostal);
    const dataInCommunesManquantes = dictionnaryCommunesManquantes[commune.code + "-" + commune.codePostal];
    console.log(dataInCommunesManquantes);
    if (!dataInCommunesManquantes) {
      console.log('/!\\ data not ok')
      failed++
      continue
    }
    communesReferentiel.push(dataInCommunesManquantes);
    count++
    console.log('...add commune manquante')
    continue
  }

  console.log('### parsing commune...')
  const coordonnees = data.features[0].geometry.coordinates
  communesReferentiel.push({
    id: `${commune.code}-${commune.codePostal}`,
    code: commune.code,
    libelle: commune.libelle,
    code_postal: commune.codePostal,
    code_departement: commune.codeDepartement,
    longitude: coordonnees[0],
    latitude: coordonnees[1]
  })
  count++
  console.log('...commune parsed')
}

try {
  console.log(
    `# Writing file : ${total} parsed${failed ? `, with ${failed} failed` : ''}`
  )
  await writeFile(
    '../src/infrastructure/sequelize/seeders/data/communes.json',
    JSON.stringify(communesReferentiel)
  )
  console.log(`ENDED ${new Date()} (started at ${start})`)
} catch (err) {
  console.error(err)
}

