import { expect } from '../../utils'
import { GetMetiersRomeQueryHandler } from '../../../src/application/queries/get-metiers-rome.query.handler.db'
import { MetierRomeSqlModel } from '../../../src/infrastructure/sequelize/models/metier-rome.sql-model'
import { unMetierRomeDto } from '../../fixtures/sql-models/metier-rome.sql-model'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'

describe('GetMetiersRomeQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let getMetiersRomeQueryHandler: GetMetiersRomeQueryHandler
  before(() => {
    databaseForTesting = getDatabase()
    getMetiersRomeQueryHandler = new GetMetiersRomeQueryHandler(
      databaseForTesting.sequelize
    )
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
  })
  it('retourne un tableau vide quand la recherche ne match pas', async () => {
    //Given
    await MetierRomeSqlModel.create(unMetierRomeDto())
    //When
    const result = await getMetiersRomeQueryHandler.execute({
      recherche: 'improbable'
    })
    //Then
    expect(result).to.deep.equal([])
  })

  it('retourne un element qui match au bon format', async () => {
    //Given
    const metier = unMetierRomeDto()
    await MetierRomeSqlModel.create(metier)

    //When
    const result = await getMetiersRomeQueryHandler.execute({
      recherche: 'Patissier'
    })

    //Then
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.be.deep.equal({
      code: metier.code,
      libelle: metier.libelle,
      score: 0.47619048
    })
  })

  it('ne prend pas en compte la casse', async () => {
    //Given
    const metiers = [
      unMetierRomeDto({
        id: 1,
        code: '1',
        libelle: 'Patissier'
      })
    ]
    await MetierRomeSqlModel.bulkCreate(metiers)
    //When
    const result = await getMetiersRomeQueryHandler.execute({
      recherche: 'patissier'
    })
    //Then
    expect(result).to.have.lengthOf(1)
  })

  it('ne prend pas en compte les accents', async () => {
    //Given
    const metier = unMetierRomeDto({
      libelle: 'Pâtissier',
      libelleSanitized: 'Patissier'
    })
    await MetierRomeSqlModel.create(metier)
    //When
    const result = await getMetiersRomeQueryHandler.execute({
      recherche: 'Patissier'
    })
    //Then
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.be.deep.equal({
      code: metier.code,
      libelle: metier.libelle,
      score: 1
    })
  })
})
