import { remove as enleverLesAccents } from 'remove-accents'
import { readFile, writeFile } from 'fs/promises'

let departements = []
try {
    departements = await readFile(
        '../src/infrastructure/sequelize/seeders/data/departement_from_api.json'
    )
} catch (err) {
    console.error(err)
    process.exit()
}

const depatementsRef = JSON.parse(departements).map(departement => {
    return {
        code: departement.code,
        libelle: enleverLesAccents(departement.libelle)   
    }
})

writeFile(
  '../src/infrastructure/sequelize/seeders/data/departements.json',
  JSON.stringify(depatementsRef),
  err => {
    if (err) {
      console.error(err)
      return
    }
  }
)
