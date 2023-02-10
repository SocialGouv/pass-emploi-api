import { INestApplication, HttpStatus } from '@nestjs/common'
import { GetAnimationsCollectivesV2QueryHandler } from 'src/application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { success } from 'src/building-blocks/types/result'
import * as request from 'supertest'
import {
  unUtilisateurDecode,
  unHeaderAuthorization
} from 'test/fixtures/authentification.fixture'
import { StubbedClass } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'

describe('EtablissementsControllerV2', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesV2QueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAnimationsCollectivesQueryHandler = app.get(
      GetAnimationsCollectivesV2QueryHandler
    )
  })

  describe('GET v2/etablissements/:id/animations-collectives', () => {
    it("renvoie les animations collectives de l'établissement au format de pagination classique", async () => {
      // Given
      getAnimationsCollectivesQueryHandler.execute
        .withArgs(
          {
            idEtablissement: 'paris',
            page: 1,
            limit: undefined,
            aClore: true
          },
          unUtilisateurDecode()
        )
        .resolves(
          success({
            pagination: {
              page: 1,
              limit: 1,
              total: 0
            },
            resultats: []
          })
        )

      // When
      await request(app.getHttpServer())
        .get(
          '/v2/etablissements/paris/animations-collectives?page=1&aClore=true'
        )
        .set('authorization', unHeaderAuthorization())

        // Then
        .expect(HttpStatus.OK)
        .expect({
          pagination: {
            page: 1,
            limit: 1,
            total: 0
          },
          resultats: []
        })
    })

    it("retourne une erreur 400 quand page n'est pas un number", async () => {
      await request(app.getHttpServer())
        .get(`/v2/etablissements/paris/animations-collectives?page=a`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/v2/etablissements/paris/animations-collectives'
    )
  })
})
