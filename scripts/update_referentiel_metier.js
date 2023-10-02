const Pg = require('pg')
const metiersRomeJson = require('./ROME_with_appellationCode.json')

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

  console.log('ici')
  console.log(referentielMetiersRomeJson.length)
  // todo fonctionne super
  for (let i = 0; i < referentielMetiersRomeJson.length; i++) {
    try {
      await client.query(
        'UPDATE referentiel_metier_rome SET appellation_code=$1 WHERE libelle=$2',
        [
          referentielMetiersRomeJson[i].appellationCode,
          referentielMetiersRomeJson[i].libelle
        ]
      )
    } catch (err) {
      console.log(err)
      console.log(err.stack)
    }
  }

  // todo voir pourquoi ce code  ne marche pas
  // referentielMetiersRomeJson.map(async function (metier) {
  //   try {
  //     await client.query(
  //       'UPDATE referentiel_metier_rome SET appellation_code=$1 WHERE libelle=$2',
  //       [metier.appellationCode, metier.libelle]
  //     )
  //   } catch (err) {
  //     console.log(err)
  //     console.log(err.stack)
  //   }
  // })

  client.end()
  //return commande
}
