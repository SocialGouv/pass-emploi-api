const { Sequelize, QueryTypes } = require('sequelize')
const { parse } = require('pg-connection-string')

const dbUrl = 'remplir'
const apiUrlFT = 'remplir'
const tokenFT = 'remplir'

const { host, port, database, user, password } = parse(dbUrl)

const options = {
  host: host,
  port: Number(port),
  dialect: 'postgres',
  username: user,
  password: password,
  database: database,
  logging: true
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false
  //   }
  // }
}

const sequelize = new Sequelize(options)

function capitalize(input) {
  return input
    .trim()
    .replace('_', ' ')
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim()
}

function mapOrigine(offreEmploiDto) {
  let origine
  if (offreEmploiDto.origineOffre.origine === '1') {
    origine = { nom: 'France Travail' }
  } else if (
    offreEmploiDto.origineOffre.partenaires?.length &&
    offreEmploiDto.origineOffre.partenaires[0]?.logo &&
    offreEmploiDto.origineOffre.partenaires[0]?.nom
  ) {
    origine = {
      nom: capitalize(offreEmploiDto.origineOffre.partenaires[0].nom),
      logo: offreEmploiDto.origineOffre.partenaires[0].logo
    }
  }
  return origine
}

sequelize
  .query(
    `SELECT id, id_offre, titre from favori_offre_emploi where origine_nom is null`,
    { type: QueryTypes.SELECT }
  )
  .then(async favoris => {
    console.log(favoris)
    for (const fav of favoris) {
      await new Promise(resolve =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      )
      fetch(`${apiUrlFT}/partenaire/offresdemploi/v2/offres/${fav.id_offre}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenFT}` }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          console.log(response.status)

          if (response.status === 200) {
            console.log(`found ${fav.id_offre} ${fav.titre}`)
            return response.json()
          }
          // if (response.status === 204)
          //   sequelize.query(
          //     `DELETE from favori_offre_emploi WHERE id = ${fav.id}`
          //   )
          console.log(`not found ${fav.id_offre} ${fav.titre}`)
        })
        .then(offre => {
          if (offre) {
            console.log(`found ${offre.id} ${offre.intitule}`)
            const origine = mapOrigine(offre)
            if (origine)
              sequelize.query(
                `UPDATE favori_offre_emploi SET origine_nom = '${
                  origine.nom
                }', origine_logo_url = ${
                  origine.logo ? "'" + origine.logo + "'" : null
                } WHERE id = ${fav.id}`
              )
          } else {
            console.warn('no data')
          }
        })
        .catch(error => {
          console.error('Error:', error)
        })
    }
  })
  .catch(e => {
    console.error(e)
  })
