import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { DateTime } from 'luxon'
import * as request from 'supertest'
import { GetAnimationsCollectivesQueryHandler } from '../../../src/application/queries/get-animations-collectives.query.handler.db'
import { GetJeunesByEtablissementQueryHandler } from '../../../src/application/queries/get-jeunes-by-etablissement.query.handler.db'
import { success } from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('EtablissementsController', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesQueryHandler>
  let getJeunesEtablissementQueryHandler: StubbedClass<GetJeunesByEtablissementQueryHandler>
  let app: INestApplication

  before(async () => {
    getAnimationsCollectivesQueryHandler = stubClass(
      GetAnimationsCollectivesQueryHandler
    )
    getJeunesEtablissementQueryHandler = stubClass(
      GetJeunesByEtablissementQueryHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetAnimationsCollectivesQueryHandler)
      .useValue(getAnimationsCollectivesQueryHandler)
      .overrideProvider(GetJeunesByEtablissementQueryHandler)
      .useValue(getJeunesEtablissementQueryHandler)
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

  describe('GET etablissements/:id/jeunes', () => {
    it("renvoie les jeunes de l'établissement", async () => {
      // Given
      getJeunesEtablissementQueryHandler.execute
        .withArgs(
          {
            idEtablissement: '75114'
          },
          unUtilisateurDecode()
        )
        .resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get('/etablissements/75114/jeunes')
        .set('authorization', unHeaderAuthorization())

        // Then
        .expect(HttpStatus.OK)
        .expect([])
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/etablissements/75114/jeunes'
    )
  })
})
