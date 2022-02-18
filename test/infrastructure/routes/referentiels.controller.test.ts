import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { GetCommunesEtDepartementsQueryHandler } from '../../../src/application/queries/get-communes-et-departements.query.handler'
import { CommunesEtDepartementsQueryModel } from '../../../src/application/queries/query-models/communes-et-departements.query-model'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'

let getCommunesEtDepartementsQueryHandler: StubbedClass<GetCommunesEtDepartementsQueryHandler>
describe('ReferentielsController', () => {
  getCommunesEtDepartementsQueryHandler = stubClass(
    GetCommunesEtDepartementsQueryHandler
  )
  let app: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetCommunesEtDepartementsQueryHandler)
      .useValue(getCommunesEtDepartementsQueryHandler)
      .compile()
    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /referentiels/communes-et-departements?recherche=abcde', () => {
    it('renvoie les communes et departements demandés', () => {
      // Given
      getCommunesEtDepartementsQueryHandler.execute
        .withArgs({ recherche: 'abcde', villesOnly: false })
        .resolves([
          {
            libelle: 'abcde',
            code: '5',
            codePostal: '78907',
            type: CommunesEtDepartementsQueryModel.Type.COMMUNE,
            score: 0.3
          },
          {
            libelle: 'abcd',
            code: '4',
            type: CommunesEtDepartementsQueryModel.Type.DEPARTEMENT,
            score: 0.2
          }
        ])

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/communes-et-departements?recherche=abcde')
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect([
          {
            code: '5',
            codePostal: '78907',
            libelle: 'abcde',
            score: 0.3,
            type: 'COMMUNE'
          },
          {
            code: '4',
            libelle: 'abcd',
            score: 0.2,
            type: 'DEPARTEMENT'
          }
        ])
    })

    it('renvoie les communes seulement', () => {
      // Given
      getCommunesEtDepartementsQueryHandler.execute
        .withArgs({
          recherche: 'abcde',
          villesOnly: true
        })
        .resolves([
          {
            libelle: 'abcde',
            code: '5',
            codePostal: '78907',
            type: CommunesEtDepartementsQueryModel.Type.COMMUNE,
            score: 0.3
          }
        ])

      // When - Then
      return request(app.getHttpServer())
        .get(
          '/referentiels/communes-et-departements?recherche=abcde&villesOnly=true'
        )
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect([
          {
            code: '5',
            codePostal: '78907',
            libelle: 'abcde',
            score: 0.3,
            type: 'COMMUNE'
          }
        ])
    })
  })
})
