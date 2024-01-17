import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { URLSearchParams } from 'url'
import { expect } from 'chai'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { TIMEOUT } from 'dns'
import { ImmersionClient } from '../../../../src/infrastructure/clients/immersion-client'
import { FindAllOffresImmersionQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-immersion.query.getter.db'
import { StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { unMetierRomeDto } from '../../../fixtures/sql-models/metier-rome.sql-model'
import { MetierRomeSqlModel } from '../../../../src/infrastructure/sequelize/models/metier-rome.sql-model'

describe('FindAllOffresImmersionQueryGetter', () => {
  let databaseForTesting: DatabaseForTesting
  let immersionClient: StubbedClass<ImmersionClient>
  let findAllOffresImmersionQueryGetter: FindAllOffresImmersionQueryGetter

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    immersionClient = stubClass(ImmersionClient)
    findAllOffresImmersionQueryGetter = new FindAllOffresImmersionQueryGetter(
      immersionClient,
      databaseForTesting.sequelize
    )
  })

  describe('handle', () => {
    describe('quand la requête est correcte', () => {
      it('renvoie les offres', async () => {
        // Given
        const metiers = [
          unMetierRomeDto({
            id: 1,
            code: 'D1102',
            libelle: 'Aide-Boulanger',
            appellationCode: '10868'
          }),
          unMetierRomeDto({
            id: 2,
            code: 'D1102',
            libelle: 'Boulanger',
            appellationCode: '11573'
          }),
          unMetierRomeDto({
            id: 3,
            code: 'D1102',
            libelle: 'Boulanger-Patissier',
            appellationCode: '11574'
          }),
          unMetierRomeDto({
            id: 4,
            code: 'D1102',
            libelle: 'Boulanger-Traiteur',
            appellationCode: '11576'
          })
        ]

        await MetierRomeSqlModel.bulkCreate(metiers)

        const query = {
          rome: 'D1102',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }
        const appellationCodes = ['10868', '11573', '11574', '11576']

        const response: AxiosResponse = {
          data: [
            {
              rome: 'mon-rome',
              siret: 'siret',
              romeLabel: 'romeLabel',
              name: 'name',
              nafLabel: 'nafLabel',
              address: { city: 'city' },
              voluntaryToImmersion: true,
              appellations: [
                {
                  appellationCode: 'appellationCode',
                  appellationLabel: 'appellationCodeLabel'
                }
              ]
            }
          ],
          status: 200,
          statusText: 'OK',
          request: '',
          headers: '',
          config: ''
        }

        const params = new URLSearchParams()
        params.append('distanceKm', query.distance_km.toString())
        params.append('longitude', query.location.lon.toString())
        params.append('latitude', query.location.lat.toString())
        params.append('appellationCodes[]', appellationCodes[3])
        params.append('appellationCodes[]', appellationCodes[2])
        params.append('appellationCodes[]', appellationCodes[1])
        params.append('appellationCodes[]', appellationCodes[0])
        params.append('sortedBy', 'date')
        params.append('voluntaryToImmersion', 'true')

        immersionClient.getOffres.resolves(success(response.data))

        // When
        const offres = await findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(immersionClient.getOffres.getCall(0).args).to.be.deep.equal([
          params
        ])
        expect(offres).to.deep.equal(
          success([
            {
              id: 'siret-appellationCode',
              metier: 'appellationCodeLabel',
              nomEtablissement: 'name',
              secteurActivite: 'nafLabel',
              ville: 'city',
              estVolontaire: true
            }
          ])
        )
      })
    })
    describe('quand la requête est mauvaise', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        immersionClient.getOffres.resolves(
          failure(new ErreurHttp('un message d’erreur', 404))
        )

        // When
        const offres = await findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(offres).to.deep.equal(
          failure(new ErreurHttp('un message d’erreur', 404))
        )
      })
    })
    describe('quand la requête renvoie une erreur', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const error: Error = new Error(TIMEOUT)

        immersionClient.getOffres.rejects(error)

        // When
        const call = findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        await expect(call).to.be.rejectedWith(error)
      })
    })
  })
})
