import { HttpStatus, INestApplication } from '@nestjs/common'
import { failure, success } from 'src/building-blocks/types/result'
import * as request from 'supertest'
import { StubbedClass, expect } from 'test/utils'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { SendNotificationsNouveauxMessagesExternesCommandHandler } from '../../../src/application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { EnvoyerNotificationsExternePayload } from '../../../src/infrastructure/routes/validation/conseiller-pole-emploi.inputs'

describe('ConseillersPoleEmploiController', () => {
  let notifierNouveauxMessagesExternes: StubbedClass<SendNotificationsNouveauxMessagesExternesCommandHandler>
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    notifierNouveauxMessagesExternes = app.get(
      SendNotificationsNouveauxMessagesExternesCommandHandler
    )
  })

  describe('POST /conseillers/pole-emploi/beneficiaires/notifier-message', () => {
    describe('quand tout va bien', () => {
      it('notifie les bénéficiaires et renvoie une 200', async () => {
        // Given
        const payload: EnvoyerNotificationsExternePayload = {
          idsAuthentificationBeneficiaires: ['id-auth-1', 'id-auth-2']
        }

        notifierNouveauxMessagesExternes.execute
          .withArgs({
            idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
          })
          .resolves(success({ idsNonTrouves: [] }))

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/pole-emploi/beneficiaires/notifier-message')
          .set({ 'X-API-KEY': 'api-key-consumer-pole-emploi' })
          .send(payload)
          .expect(HttpStatus.CREATED)

        expect(
          notifierNouveauxMessagesExternes.execute
        ).to.have.been.calledWithExactly({
          idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
        })
      })
    })

    describe('quand le conseiller cible n’existe pas', () => {
      it('renvoie une 404 Not found', async () => {
        // Given
        const payload: EnvoyerNotificationsExternePayload = {
          idsAuthentificationBeneficiaires: ['id-auth-1', 'id-auth-2']
        }

        notifierNouveauxMessagesExternes.execute
          .withArgs({
            idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
          })
          .resolves(
            failure(
              new NonTrouveError(
                'Conseiller',
                'idAuthentification id-auth-conseiller'
              )
            )
          )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/pole-emploi/beneficiaires/notifier-message')
          .set({ 'X-API-KEY': 'api-key-consumer-pole-emploi' })
          .send(payload)
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('quand le conseiller cible n’est pas Pôle emploi', () => {
      it('renvoie une 403 Forbidden', async () => {
        // Given
        const payload: EnvoyerNotificationsExternePayload = {
          idsAuthentificationBeneficiaires: ['id-auth-1', 'id-auth-2']
        }

        notifierNouveauxMessagesExternes.execute
          .withArgs({
            idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
          })
          .resolves(failure(new DroitsInsuffisants()))

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/pole-emploi/beneficiaires/notifier-message')
          .set({ 'X-API-KEY': 'api-key-consumer-pole-emploi' })
          .send(payload)
          .expect(HttpStatus.FORBIDDEN)
      })
    })

    describe('est sécurisée', () => {
      it('retourne 401 API KEY non présente', async () => {
        // When
        const result = await request(app.getHttpServer())
          .post('/conseillers/pole-emploi/beneficiaires/notifier-message')
          .send({})

        // Then
        expect(result.body).to.deep.equal({
          statusCode: 401,
          message: "API KEY non présent dans le header 'X-API-KEY'",
          error: 'Unauthorized'
        })
      })

      it('retourne 401 API KEY non valide', async () => {
        // When
        const result = await request(app.getHttpServer())
          .post('/conseillers/pole-emploi/beneficiaires/notifier-message')
          .send({})
          .set({ 'X-API-KEY': 'api-key-keycloak-invalide' })

        // Then
        expect(result.body).to.deep.equal({
          statusCode: 401,
          message: 'API KEY non valide',
          error: 'Unauthorized'
        })
      })
    })
  })
})
