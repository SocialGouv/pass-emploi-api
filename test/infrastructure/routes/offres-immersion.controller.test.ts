import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import { OffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-models'
import { RechercheOffreInvalide } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('OffresImmersionController', () => {
  let getOffresImmersionQueryHandler: StubbedClass<GetOffresImmersionQueryHandler>
  let app: INestApplication

  before(async () => {
    getOffresImmersionQueryHandler = stubClass(GetOffresImmersionQueryHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetOffresImmersionQueryHandler)
      .useValue(getOffresImmersionQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /offres-immersion', () => {
    describe('quand tout va bien', () => {
      it("fait appel à l'API Immersion avec les bons paramètres", async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161
        }

        const offresImmersionQueryModel: OffreImmersionQueryModel[] = [
          {
            id: '1',
            metier: 'Boulanger',
            nomEtablissement: 'Boulangerie',
            secteurActivite: 'Restauration',
            ville: 'Paris'
          }
        ]

        getOffresImmersionQueryHandler.execute.resolves(
          success(offresImmersionQueryModel)
        )

        // When
        const result = await request(app.getHttpServer())
          .get('/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .query(getOffresImmersionQuery)
          // Then
          .expect(HttpStatus.OK)

        expect(result.body).to.deep.equal(offresImmersionQueryModel)
      })
    })
    describe('quand la requête est mauvaise', () => {
      it("renvoie un message d'erreur", async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161
        }

        getOffresImmersionQueryHandler.execute.resolves(
          failure(new RechercheOffreInvalide('Les champs sont pas bons'))
        )

        // When
        await request(app.getHttpServer())
          .get('/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .query(getOffresImmersionQuery)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/offres-immersion')
  })
})
