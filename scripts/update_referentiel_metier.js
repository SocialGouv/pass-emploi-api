const Pg = require('pg')
const metiersRomeJson = require('../src/infrastructure/sequelize/seeders/data/metiers-rome.json')

const databaseConfiguration = {
  user: 'passemploi',
  host: 'localhost',
  database: 'passemploidb',
  password: 'passemploi',
  port: 55432
}

updateReferentiel()

async function updateReferentiel() {
  const client = new Pg.Client(databaseConfiguration)
  client.connect()

  const referentielMetiersRomeJson = metiersRomeJson

  console.log('nombre de ligne : ', referentielMetiersRomeJson.length)

  for (let i = 0; i < referentielMetiersRomeJson.length; i++) {
    try {
      await client.query(
        'UPDATE referentiel_metier_rome SET appellation_code=$1 WHERE libelle=$2',
        [
          referentielMetiersRomeJson[i].appellation_code,
          referentielMetiersRomeJson[i].libelle
        ]
      )
    } catch (err) {
      console.log(err)
      console.log(err.stack)
    }
  }

  client.end()
}
