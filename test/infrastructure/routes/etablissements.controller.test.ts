import { HttpStatus, INestApplication } from '@nestjs/common'
import { DateTime } from 'luxon'
import * as request from 'supertest'
import { CloturerAnimationCollectiveCommandHandler } from '../../../src/application/commands/cloturer-animation-collective.command.handler'
import { GetJeunesByEtablissementQueryHandler } from '../../../src/application/queries/get-jeunes-by-etablissement.query.handler.db'
import { GetAnimationsCollectivesQueryHandler } from '../../../src/application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import {
  emptySuccess,
  success
} from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { StubbedClass, expect } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { GetJeunesEtablissementV2QueryHandler } from '../../../src/application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { GetAnimationsCollectivesV2QueryHandler } from '../../../src/application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'

describe('EtablissementsController', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesQueryHandler>
  let getJeunesEtablissementQueryHandler: StubbedClass<GetJeunesByEtablissementQueryHandler>
  let cloturerAnimationCollectiveCommandHandler: StubbedClass<CloturerAnimationCollectiveCommandHandler>
  let getAnimationsV2CollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesV2QueryHandler>
  let getJeunesEtablissementV2QueryHandler: StubbedClass<GetJeunesEtablissementV2QueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAnimationsCollectivesQueryHandler = app.get(
      GetAnimationsCollectivesQueryHandler
    )
    getJeunesEtablissementQueryHandler = app.get(
      GetJeunesByEtablissementQueryHandler
    )
    cloturerAnimationCollectiveCommandHandler = app.get(
      CloturerAnimationCollectiveCommandHandler
    )
    getAnimationsV2CollectivesQueryHandler = app.get(
      GetAnimationsCollectivesV2QueryHandler
    )
    getJeunesEtablissementV2QueryHandler = app.get(
      GetJeunesEtablissementV2QueryHandler
    )
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

  describe('POST animations-collectives/:idAnimationCollective/cloturer', () => {
    it('cloture une animation collective', async () => {
      // Given
      const idsJeunes = ['1']
      const idAnimationCollective = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      cloturerAnimationCollectiveCommandHandler.execute.resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .post(
          `/etablissements/animations-collectives/${idAnimationCollective}/cloturer`
        )
        .set('authorization', unHeaderAuthorization())
        .send({ idsJeunes })
        .expect(HttpStatus.CREATED)

      expect(
        cloturerAnimationCollectiveCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idAnimationCollective,
          idsJeunes
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/etablissements/animations-collectives/123/cloturer'
    )
  })

  describe('GET v2/etablissements/:id/animations-collectives', () => {
    it("renvoie les animations collectives de l'établissement au format de pagination classique", async () => {
      // Given
      getAnimationsV2CollectivesQueryHandler.execute
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
