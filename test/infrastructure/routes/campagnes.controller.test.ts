import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { CreateCampagneCommandHandler } from '../../../src/application/commands/create-campagne.command'
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
import { CreateEvaluationCommandHandler } from '../../../src/application/commands/create-evaluation.command'

describe('CampagnesController', () => {
  let createCampagneCommandHandler: StubbedClass<CreateCampagneCommandHandler>
  let createEvaluationCommandHandler: StubbedClass<CreateEvaluationCommandHandler>
  let app: INestApplication

  beforeEach(async () => {
    createCampagneCommandHandler = stubClass(CreateCampagneCommandHandler)
    createEvaluationCommandHandler = stubClass(CreateEvaluationCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateCampagneCommandHandler)
      .useValue(createCampagneCommandHandler)
      .overrideProvider(CreateEvaluationCommandHandler)
      .useValue(createEvaluationCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
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
            idCampagne: 'idCampagne',
            reponses: []
          })
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/jeunes/idJeune/campagnes/idCampagne/evaluer')
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
            idCampagne: 'idCampagne',
            reponses: []
          })
          .resolves(failure(new ReponsesCampagneInvalide()))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/idJeune/campagnes/idCampagne/evaluer')
          .set('authorization', unHeaderAuthorization())
          .send([])

          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/idJeune/campagnes/idCampagne/evaluer'
    )
  })
})
