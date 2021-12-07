import { GetCommunesEtDepartementsQueryHandler } from '../../../src/application/queries/get-communes-et-departements.query.handler'
import { CommunesEtDepartementsQueryModel } from '../../../src/application/queries/query-models/communes-et-departements.query-model'
import { CommuneSqlModel } from '../../../src/infrastructure/sequelize/models/commune.sql-model'
import { DepartementSqlModel } from '../../../src/infrastructure/sequelize/models/departement.sql-model'
import { uneCommuneDto } from '../../fixtures/sql-models/commune.sql-model'
import { unDepartementDto } from '../../fixtures/sql-models/departement.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('GetCommunesEtDepartementsQueryHandler', () => {
  const db = DatabaseForTesting.prepare()
  let getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler
  before(() => {
    getCommunesEtDepartementsQueryHandler =
      new GetCommunesEtDepartementsQueryHandler(db.sequelize)
  })
  describe('Avec que des départements', () => {
    it('retourne un tableau vide quand la recherche ne match pas', async () => {
      //Given
      await DepartementSqlModel.create(unDepartementDto())
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'improbable'
      })
      //Then
      expect(result).to.deep.equal([])
    })
    it('retourne un element qui match au bon format', async () => {
      //Given
      const departement = unDepartementDto()
      await DepartementSqlModel.create(departement)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'abcd'
      })
      //Then
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.be.deep.equal({
        code: departement.code,
        libelle: departement.libelle,
        type: CommunesEtDepartementsQueryModel.Type.DEPARTEMENT,
        score: 0.5714286
      })
    })
    it('limite à 5 le nombre de résultats', async () => {
      //Given
      const departements = [
        unDepartementDto({
          id: '1',
          code: '1',
          libelle: '1'
        }),
        unDepartementDto({
          id: '2',
          code: '2',
          libelle: '1'
        }),
        unDepartementDto({
          id: '3',
          code: '3',
          libelle: '1'
        }),
        unDepartementDto({
          id: '4',
          code: '4',
          libelle: '1'
        }),
        unDepartementDto({
          id: '5',
          code: '5',
          libelle: '1'
        }),
        unDepartementDto({
          id: '6',
          code: '6',
          libelle: '1'
        })
      ]
      await DepartementSqlModel.bulkCreate(departements)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: '1'
      })
      //Then
      expect(result).to.have.lengthOf(5)
    })
    it('ne prend pas en compte la casse', async () => {
      //Given
      const departements = [
        unDepartementDto({
          id: '1',
          code: '1',
          libelle: 'aBcDe'
        })
      ]
      await DepartementSqlModel.bulkCreate(departements)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'AbcdE'
      })
      //Then
      expect(result).to.have.lengthOf(1)
    })
    it('ne prend pas en compte les accents', async () => {
      //Given
      const departement = unDepartementDto({ libelle: 'CRETEIL' })
      await DepartementSqlModel.create(departement)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'çréteîl'
      })
      //Then
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.be.deep.equal({
        code: departement.code,
        libelle: departement.libelle,
        type: CommunesEtDepartementsQueryModel.Type.DEPARTEMENT,
        score: 1
      })
    })
    describe('quand il a y a plus de 5 résultats', async () => {
      it('prend le top 5 par rapport au score de recherche', async () => {
        //Given
        const departements = [
          unDepartementDto({
            id: '2',
            code: '2',
            libelle: 'a b'
          }),
          unDepartementDto({
            id: '3',
            code: '3',
            libelle: 'a c'
          }),
          unDepartementDto({
            id: '1',
            code: '1',
            libelle: 'a'
          }),
          unDepartementDto({
            id: '4',
            code: '4',
            libelle: 'a d'
          }),
          unDepartementDto({
            id: '5',
            code: '5',
            libelle: 'a e'
          }),
          unDepartementDto({
            id: '6',
            code: '6',
            libelle: 'a fg'
          })
        ]
        await DepartementSqlModel.bulkCreate(departements)

        //When
        const result = await getCommunesEtDepartementsQueryHandler.execute({
          recherche: 'a'
        })
        //Then
        expect(result).to.have.lengthOf(5)
        expect(result).to.contains.deep.members([
          {
            libelle: 'a',
            code: '1',
            type: 'DEPARTEMENT',
            score: 1
          },
          {
            libelle: 'a b',
            code: '2',
            type: 'DEPARTEMENT',
            score: 0.5
          },
          {
            libelle: 'a c',
            code: '3',
            type: 'DEPARTEMENT',
            score: 0.5
          },
          {
            libelle: 'a d',
            code: '4',
            type: 'DEPARTEMENT',
            score: 0.5
          },
          {
            libelle: 'a e',
            code: '5',
            type: 'DEPARTEMENT',
            score: 0.5
          }
        ])
      })
    })
  })
  describe('Avec que des communes', () => {
    it('retourne un tableau vide quand la recherche ne match pas', async () => {
      //Given
      await CommuneSqlModel.create(uneCommuneDto())
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'improbable'
      })
      //Then
      expect(result).to.deep.equal([])
    })
    it('retourne un element qui match au bon format', async () => {
      //Given
      const commune = uneCommuneDto()
      await CommuneSqlModel.create(commune)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'abcd'
      })
      //Then
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.be.deep.equal({
        code: commune.code,
        libelle: commune.libelle,
        codePostal: commune.codePostal,
        type: CommunesEtDepartementsQueryModel.Type.COMMUNE,
        score: 0.5714286
      })
    })
    it('limite à 5 le nombre de résultats', async () => {
      //Given
      const communes = [
        uneCommuneDto({
          id: '1',
          code: '1',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '2',
          code: '2',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '3',
          code: '3',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '4',
          code: '4',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '5',
          code: '5',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '6',
          code: '6',
          libelle: '1'
        })
      ]
      await CommuneSqlModel.bulkCreate(communes)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: '1'
      })
      //Then
      expect(result).to.have.lengthOf(5)
    })
    it('ne prend pas en compte la casse', async () => {
      //Given
      const departements = [
        uneCommuneDto({
          id: '1',
          code: '1',
          libelle: 'aBcDe'
        })
      ]
      await CommuneSqlModel.bulkCreate(departements)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'AbcdE'
      })
      //Then
      expect(result).to.have.lengthOf(1)
    })
    it('ne prend pas en compte les accents', async () => {
      //Given
      const commune = uneCommuneDto({ libelle: 'CRETEIL' })
      await CommuneSqlModel.create(commune)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'çréteîl'
      })
      //Then
      expect(result).to.have.lengthOf(1)
      expect(result[0]).to.be.deep.equal({
        code: commune.code,
        libelle: commune.libelle,
        codePostal: commune.codePostal,
        type: CommunesEtDepartementsQueryModel.Type.COMMUNE,
        score: 1
      })
    })
    describe('quand il a y a plus de 5 résultats', async () => {
      it('fait un tri sur le libelle les plus long', async () => {
        //Given
        const communes = [
          uneCommuneDto({
            id: '2',
            code: '2',
            libelle: 'a b'
          }),
          uneCommuneDto({
            id: '3',
            code: '3',
            libelle: 'a c'
          }),
          uneCommuneDto({
            id: '1',
            code: '1',
            libelle: 'a'
          }),
          uneCommuneDto({
            id: '4',
            code: '4',
            libelle: 'a d'
          }),
          uneCommuneDto({
            id: '5',
            code: '5',
            libelle: 'a e'
          }),
          uneCommuneDto({
            id: '6',
            code: '6',
            libelle: 'a ef'
          })
        ]
        await CommuneSqlModel.bulkCreate(communes)

        //When
        const result = await getCommunesEtDepartementsQueryHandler.execute({
          recherche: 'a'
        })
        //Then
        expect(result).to.have.lengthOf(5)
        expect(result).to.not.contains.deep.members([
          {
            libelle: 'a',
            code: '1',
            type: 'COMMUNE'
          }
        ])
      })
    })
  })
  describe('Avec des communes et des départements', () => {
    it('retourne un tableau vide quand la recherche ne match pas', async () => {
      //Given
      await CommuneSqlModel.create(uneCommuneDto())
      await DepartementSqlModel.create(unDepartementDto())
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'improbable'
      })
      //Then
      expect(result).to.deep.equal([])
    })
    it('retourne deux elements qui match au bon format', async () => {
      //Given
      const commune = uneCommuneDto()
      await CommuneSqlModel.create(commune)
      const departememt = unDepartementDto()
      await DepartementSqlModel.create(departememt)

      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'abcd'
      })
      //Then
      expect(result).to.have.lengthOf(2)
      expect(result).to.have.deep.members([
        {
          libelle: 'abcde',
          code: '12345',
          type: 'DEPARTEMENT',
          score: 0.5714286
        },
        {
          libelle: 'abcde',
          code: '12345',
          codePostal: '12345',
          type: 'COMMUNE',
          score: 0.5714286
        }
      ])
    })
    it('limite à 5 le nombre de résultats', async () => {
      //Given
      const communes = [
        uneCommuneDto({
          id: '1',
          code: '1',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '2',
          code: '2',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '3',
          code: '3',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '4',
          code: '4',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '5',
          code: '5',
          libelle: '1'
        }),
        uneCommuneDto({
          id: '6',
          code: '6',
          libelle: '1'
        })
      ]
      await CommuneSqlModel.bulkCreate(communes)
      const departements = [
        unDepartementDto({
          id: '1',
          code: '1',
          libelle: '1'
        }),
        unDepartementDto({
          id: '2',
          code: '2',
          libelle: '1'
        }),
        unDepartementDto({
          id: '3',
          code: '3',
          libelle: '1'
        }),
        unDepartementDto({
          id: '4',
          code: '4',
          libelle: '1'
        }),
        unDepartementDto({
          id: '5',
          code: '5',
          libelle: '1'
        }),
        unDepartementDto({
          id: '6',
          code: '6',
          libelle: '1'
        })
      ]
      await DepartementSqlModel.bulkCreate(departements)
      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: '1'
      })
      //Then
      expect(result).to.have.lengthOf(5)
    })
    it('ne prend pas en compte la casse', async () => {
      //Given
      const commune = uneCommuneDto({ libelle: 'aBcDe' })
      await CommuneSqlModel.create(commune)
      const departememt = unDepartementDto({ libelle: 'aBcDe' })
      await DepartementSqlModel.create(departememt)

      //When
      const result = await getCommunesEtDepartementsQueryHandler.execute({
        recherche: 'AbcdE'
      })
      //Then
      expect(result).to.have.lengthOf(2)
    })
    describe('quand il a y a plus que 5 résultats', async () => {
      it('fait un tri sur le libelle les plus long', async () => {
        //Given
        const communes = [
          uneCommuneDto({
            id: '2',
            code: '2',
            libelle: 'a b'
          }),
          uneCommuneDto({
            id: '3',
            code: '3',
            libelle: 'a c'
          }),
          uneCommuneDto({
            id: '1',
            code: '1',
            libelle: 'a'
          })
        ]
        await CommuneSqlModel.bulkCreate(communes)
        const departements = [
          unDepartementDto({
            id: '4',
            code: '4',
            libelle: 'a d'
          }),
          unDepartementDto({
            id: '5',
            code: '5',
            libelle: 'a e'
          }),
          unDepartementDto({
            id: '7',
            code: '7',
            libelle: 'a'
          }),
          unDepartementDto({
            id: '6',
            code: '6',
            libelle: 'a ef'
          })
        ]
        await DepartementSqlModel.bulkCreate(departements)

        //When
        const result = await getCommunesEtDepartementsQueryHandler.execute({
          recherche: 'a'
        })
        //Then
        expect(result).to.have.lengthOf(5)
        expect(result).to.have.deep.members([
          {
            libelle: 'a',
            code: '7',
            type: 'DEPARTEMENT',
            score: 1
          },
          {
            libelle: 'a',
            code: '1',
            type: 'COMMUNE',
            codePostal: '12345',
            score: 1
          },
          {
            libelle: 'a d',
            code: '4',
            type: 'DEPARTEMENT',
            score: 0.5
          },
          {
            libelle: 'a e',
            code: '5',
            type: 'DEPARTEMENT',
            score: 0.5
          },
          {
            libelle: 'a b',
            code: '2',
            type: 'COMMUNE',
            codePostal: '12345',
            score: 0.5
          }
        ])
      })
    })
  })
})
