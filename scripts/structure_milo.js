const Fs = require('fs')
const csv = require('csv-reader')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '/../.environment') })

const { Sequelize } = require('sequelize')
const trigramSimilarity = require('trigram-similarity')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 20,
    min: 0,
    acquire: 15000000,
    idle: 10000
  }
})

Promise.all([
  new Promise(function (resolve) {
    Fs.readFile(
      '/Users/sonny.klotz/IdeaProjects/pass-emploi-api/scripts/conseillers-milo.csv',
      'utf-8',
      function (err, data) {
        resolve(data)
      }
    )
  }),
  new Promise(function (resolve) {
    Fs.readFile(
      '/Users/sonny.klotz/IdeaProjects/pass-emploi-api/scripts/conseillers-milo-du-cej-reponse.csv',
      'utf-8',
      function (err, data) {
        resolve(data)
      }
    )
  })
])
  .then(async results => {
    let [cejCsv, miloCsv] = results
    let conseillersCsvCej = cejCsv.split('\n').slice(1, -1)
    let conseillersCsvMilo = miloCsv.split('\n').slice(1, -1)

    let idsConseillers = conseillersCsvCej.map(user => {
      return user.split(',')[1]
    })
    let idsConseillersSqlValues = ''
    idsConseillers.slice(0, -1).forEach(id => {
      idsConseillersSqlValues += "'" + id + "'" + ','
    })
    idsConseillersSqlValues +=
      "'" + idsConseillers[idsConseillers.length - 1] + "'"

    let data = await sequelize.query(
      `select conseiller.id, conseiller.id_agence, agence.nom_agence, agence.code_departement
            from conseiller left join agence on conseiller.id_agence = agence.id
            where conseiller.id in (${idsConseillersSqlValues});`
    )
    let conseillersSql = data[0]
    let idsConseillersSqlAvecAgence = conseillersSql
      .filter(consSql => {
        return consSql.nom_agence !== null
      })
      .map(consSql => {
        return consSql.id
      })
    let idsConseillersSqlSansAgence = conseillersSql
      .filter(consSql => {
        return consSql.nom_agence === null
      })
      .map(consSql => {
        return consSql.id
      })

    // 6459 conseillers à analyser

    // Pas de structure milo 2 cas : 722 conseillers
    // structure milo NOK - structure cej NOK : 447 conseillers inactifs milo et cej
    // structure milo NOK - structure cej OK : 275 ano1 conseiller actif sans structure milo de reference
    // ----> Creuser plus loin si ces 275 conseillers sont vraiment actifs

    // Avec structure milo 3 cas : 5737 conseiller
    // structure milo OK - structure cej NOK : 2062 conseillers inactifs cej
    // structure milo OK - structure cej OK : 38 ano2 si les structures ne correspondent pas
    // structure milo OK - structure cej OK : 3639 mapping faisable

    // idAuth_idCej_login_email
    // login_email_idMlPrincipale_NomOfficiel_NomUsuel

    let loginUtilisateursSansStructureMilo = conseillersCsvMilo
      .filter(user => {
        return user.split(';')[2] === ''
      })
      .map(user => {
        return user.split(';')[0]
      })

    let idsUtilisateursSansStructureMilo = conseillersCsvCej
      .filter(user => {
        return loginUtilisateursSansStructureMilo.includes(user.split(',')[2])
      })
      .map(user => {
        return user.split(',')[1]
      })

    let countConseillersInactifsPasDeStructureMilo = 0
    idsUtilisateursSansStructureMilo.forEach(id => {
      if (idsConseillersSqlSansAgence.includes(id)) {
        countConseillersInactifsPasDeStructureMilo++
      }
    })

    let idsConseillersActifsPasDeStructureMilo = []
    idsUtilisateursSansStructureMilo.forEach(id => {
      if (idsConseillersSqlAvecAgence.includes(id)) {
        idsConseillersActifsPasDeStructureMilo.push(id)
      }
    })

    console.log('Sans structure milo')
    console.log(idsUtilisateursSansStructureMilo.length)
    console.log(countConseillersInactifsPasDeStructureMilo)
    console.log(idsConseillersActifsPasDeStructureMilo.length)
    console.log('Avec structure milo')

    let loginUtilisateursAvecStructureMilo = conseillersCsvMilo
      .filter(user => {
        return user.split(';')[2] !== ''
      })
      .map(user => {
        return user.split(';')[0]
      })

    let idsUtilisateursAvecStructureMilo = conseillersCsvCej
      .filter(user => {
        return loginUtilisateursAvecStructureMilo.includes(user.split(',')[2])
      })
      .map(user => {
        return user.split(',')[1]
      })

    let countConseillersInactifsAvecStructureMilo = 0
    idsUtilisateursAvecStructureMilo.forEach(id => {
      if (idsConseillersSqlSansAgence.includes(id)) {
        countConseillersInactifsAvecStructureMilo++
      }
    })

    console.log(idsUtilisateursAvecStructureMilo.length)
    console.log(countConseillersInactifsAvecStructureMilo)

    let idsConseillersActifsAvecStructureMilo = []
    idsUtilisateursAvecStructureMilo.forEach(id => {
      if (idsConseillersSqlAvecAgence.includes(id)) {
        idsConseillersActifsAvecStructureMilo.push(id)
      }
    })

    let agencesConseillers = []
    idsConseillersActifsAvecStructureMilo.forEach(id => {
      let conseiller = {
        id: '',
        login: '',
        idAgenceCej: '',
        nomAgenceCej: '',
        departementAgenceCej: '',
        idStructureMilo: '',
        nomStructureMiloOfficiel: '',
        nomStructureMiloUsuel: ''
      }
      let conseillerSql = conseillersSql.find(cons => {
        return cons.id === id
      })
      conseiller.id = id
      conseiller.idAgenceCej = conseillerSql.id_agence
      conseiller.nomAgenceCej = conseillerSql.nom_agence
      conseiller.departementAgenceCej =
        conseillerSql.code_departement.length > 1
          ? conseillerSql.code_departement
          : '0' + conseillerSql.code_departement

      conseiller.login = conseillersCsvCej
        .find(row => {
          return row.split(',')[1] === id
        })
        .split(',')[2]

      let conseillerCsvMilo = conseillersCsvMilo.find(row => {
        return row.split(';')[0] === conseiller.login
      })
      conseiller.idStructureMilo = conseillerCsvMilo.split(';')[2]
      conseiller.nomStructureMiloOfficiel = conseillerCsvMilo.split(';')[3]
      conseiller.nomStructureMiloUsuel = conseillerCsvMilo.split(';')[4]

      agencesConseillers.push(conseiller)
    })

    let countAnomalieAgenceDifferente = 0
    let countMappingOk = 0
    agencesConseillers.forEach(conseiller => {
      if (
        conseiller.departementAgenceCej !==
          conseiller.nomStructureMiloOfficiel.split('-')[0] &&
        trigramSimilarity(
          conseiller.nomAgenceCej,
          conseiller.nomStructureMiloUsuel
        ) < 0.15
      ) {
        countAnomalieAgenceDifferente++
        //console.log(conseiller)
      } else {
        countMappingOk++
      }
    })
    console.log(countAnomalieAgenceDifferente)
    console.log(countMappingOk)
  })
  .catch(err => {
    console.log(err)
  })
