import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { GetAnimationsCollectivesQueryHandler } from '../../../src/application/queries/get-animations-collectives.query.handler.db'
import { DateTime } from 'luxon'
import { success } from '../../../src/building-blocks/types/result'

describe('EtablissementsController', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesQueryHandler>
  let app: INestApplication

  before(async () => {
    getAnimationsCollectivesQueryHandler = stubClass(
      GetAnimationsCollectivesQueryHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetAnimationsCollectivesQueryHandler)
      .useValue(getAnimationsCollectivesQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET etablissements/:id/animations-collectives', () => {
    it("renvoie les animations collectives de l'établissement", async () => {
      // Given
      getAnimationsCollectivesQueryHandler.execute
        .withArgs(
          {
            idEtablissement: 'paris',
            dateDebut: DateTime.fromISO('2022-08-17T12:00:30+02:00', {
              setZone: true
            }),
            dateFin: DateTime.fromISO('2022-08-18T12:00:30+02:00', {
              setZone: true
            })
          },
          unUtilisateurDecode()
        )
        .resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(
          '/etablissements/paris/animations-collectives?dateDebut=2022-08-17T12%3A00%3A30%2B02%3A00&dateFin=2022-08-18T12%3A00%3A30%2B02%3A00'
        )
        .set('authorization', unHeaderAuthorization())

        // Then
        .expect(HttpStatus.OK)
        .expect([])
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/etablissements/paris/animations-collectives'
    )
  })
})
