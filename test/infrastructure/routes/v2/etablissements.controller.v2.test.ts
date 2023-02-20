import { GetJeunesEtablissementV2QueryHandler } from '../../../../src/application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../../fixtures/authentification.fixture'
import { GetAnimationsCollectivesV2QueryHandler } from '../../../../src/application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { success } from '../../../../src/building-blocks/types/result'
import { StubbedClass } from '../../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../../utils/ensure-user-authentication-fails-if-invalid'
import * as request from 'supertest'

describe('EtablissementsControllerV2', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesV2QueryHandler>
  let getJeunesEtablissementV2QueryHandler: StubbedClass<GetJeunesEtablissementV2QueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAnimationsCollectivesQueryHandler = app.get(
      GetAnimationsCollectivesV2QueryHandler
    )
    getJeunesEtablissementV2QueryHandler = app.get(
      GetJeunesEtablissementV2QueryHandler
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

  describe('GET v2/etablissements/:id/jeunes?q=<string>', () => {
    it('renvoie une liste de jeunes', async () => {
      getJeunesEtablissementV2QueryHandler.execute
        .withArgs({
          idEtablissement: 'paris',
          page: 1,
          limit: undefined,
          q: 'name'
        })
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
        .get('/v2/etablissements/paris/jeunes?page=1&q=name')
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

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/v2/etablissements/paris/jeunes'
    )
  })
})
