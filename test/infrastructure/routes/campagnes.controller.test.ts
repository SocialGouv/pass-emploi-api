import { HttpStatus, INestApplication } from '@nestjs/common'
import { StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { CreateCampagneCommandHandler } from '../../../src/application/commands/campagne/create-campagne.command'
import { CreateCampagnePayload } from '../../../src/infrastructure/routes/validation/campagnes.inputs'
import { uneCampagne } from '../../fixtures/campagne.fixture'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import {
  CampagneExisteDejaError,
  ReponsesCampagneInvalide
} from '../../../src/building-blocks/types/domain-error'
import { CreateEvaluationCommandHandler } from '../../../src/application/commands/campagne/create-evaluation.command'
import { before } from 'mocha'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('CampagnesController', () => {
  let createCampagneCommandHandler: StubbedClass<CreateCampagneCommandHandler>
  let createEvaluationCommandHandler: StubbedClass<CreateEvaluationCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    createCampagneCommandHandler = app.get(CreateCampagneCommandHandler)
    createEvaluationCommandHandler = app.get(CreateEvaluationCommandHandler)
  })

  describe('POST /campagnes', () => {
    const campagne = uneCampagne()

    describe('quand la commande est bonne', () => {
      it('crée la campagne', async () => {
        // Given
        const createCampagnePayload: CreateCampagnePayload = {
          nom: campagne.nom,
          dateDebut: campagne.dateDebut.toString(),
          dateFin: campagne.dateFin.toString()
        }

        createCampagneCommandHandler.execute
          .withArgs({
            nom: campagne.nom,
            dateDebut: campagne.dateDebut,
            dateFin: campagne.dateFin
          })
          .resolves(success({ id: campagne.id }))

        // When
        await request(app.getHttpServer())
          .post('/campagnes')
          .set('authorization', unHeaderAuthorization())
          .send(createCampagnePayload)

          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe('quand la commande est pas bonne', () => {
      it('rejette', async () => {
        // Given
        const createCampagnePayload: CreateCampagnePayload = {
          nom: campagne.nom,
          dateDebut: campagne.dateDebut.toString(),
          dateFin: campagne.dateFin.toString()
        }

        createCampagneCommandHandler.execute.resolves(
          failure(new CampagneExisteDejaError())
        )

        // When
        await request(app.getHttpServer())
          .post('/campagnes')
          .set('authorization', unHeaderAuthorization())
          .send(createCampagnePayload)

          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/campagnes')
  })

  describe('POST /jeunes/idJeune/campagnes/idCampagne/evaluer', () => {
    describe('quand la commande est bonne', () => {
      it('crée une évaluation', async () => {
        // Given
        createEvaluationCommandHandler.execute
          .withArgs({
            idJeune: 'idJeune',
            idCampagne: '319ecb4b-067f-442c-b0a2-75cf2c47ccfb',
            reponses: []
          })
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post(
            '/jeunes/idJeune/campagnes/319ecb4b-067f-442c-b0a2-75cf2c47ccfb/evaluer'
          )
          .set('authorization', unHeaderAuthorization())
          .send([])

          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe('quand la commande est pas bonne', () => {
      it('rejette', async () => {
        // Given
        createEvaluationCommandHandler.execute
          .withArgs({
            idJeune: 'idJeune',
            idCampagne: '319ecb4b-067f-442c-b0a2-75cf2c47ccfb',
            reponses: []
          })
          .resolves(failure(new ReponsesCampagneInvalide()))

        // When
        await request(app.getHttpServer())
          .post(
            '/jeunes/idJeune/campagnes/319ecb4b-067f-442c-b0a2-75cf2c47ccfb/evaluer'
          )
          .set('authorization', unHeaderAuthorization())
          .send([])

          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/idJeune/campagnes/319ecb4b-067f-442c-b0a2-75cf2c47ccfb/evaluer'
    )
  })
})
