import { HttpStatus, INestApplication } from '@nestjs/common'
import { DateTime } from 'luxon'
import * as request from 'supertest'
import { CloturerAnimationCollectiveCommandHandler } from '../../../../src/application/commands/cloturer-animation-collective.command.handler'
import { GetJeunesByEtablissementQueryHandler } from '../../../../src/application/queries/get-jeunes-by-etablissement.query.handler.db'
import { GetAnimationsCollectivesQueryHandler } from '../../../../src/application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import {
  emptySuccess,
  success
} from '../../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../../fixtures/authentification.fixture'
import { StubbedClass, expect } from '../../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'

describe('EtablissementsController', () => {
  let getAnimationsCollectivesQueryHandler: StubbedClass<GetAnimationsCollectivesQueryHandler>
  let getJeunesEtablissementQueryHandler: StubbedClass<GetJeunesByEtablissementQueryHandler>
  let cloturerAnimationCollectiveCommandHandler: StubbedClass<CloturerAnimationCollectiveCommandHandler>
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
})
