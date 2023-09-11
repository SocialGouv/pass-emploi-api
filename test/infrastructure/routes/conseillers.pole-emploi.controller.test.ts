import { HttpStatus, INestApplication } from '@nestjs/common'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import * as request from 'supertest'
import { unHeaderAuthorization } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass } from 'test/utils'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { SendNotificationsNouveauxMessagesExterneCommandHandler } from '../../../src/application/commands/send-notifications-nouveaux-messages-externe.command.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { EnvoyerNotificationsExternePayload } from '../../../src/infrastructure/routes/validation/conseiller-pole-emploi.inputs'

describe('ConseillersPoleEmploiController', () => {
  let notifierNouveauxMessagesExterne: StubbedClass<SendNotificationsNouveauxMessagesExterneCommandHandler>
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    notifierNouveauxMessagesExterne = app.get(
      SendNotificationsNouveauxMessagesExterneCommandHandler
    )
  })

  describe('GET /conseillers/pole-emploi/:idAuthentificationConseiller/beneficiaires/notifier-message', () => {
    describe('quand tout va bien', () => {
      it('notifie les bénéficiaires et renvoie une 200', async () => {
        // Given
        const payload: EnvoyerNotificationsExternePayload = {
          idsAuthentificationBeneficiaires: ['id-auth-1', 'id-auth-2']
        }

        notifierNouveauxMessagesExterne.execute
          .withArgs({
            idAuthentificationConseiller: 'id-auth-conseiller',
            idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
          })
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post(
            '/conseillers/pole-emploi/id-auth-conseiller/beneficiaires/notifier-message'
          )
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)

        expect(
          notifierNouveauxMessagesExterne.execute
        ).to.have.been.calledWithExactly({
          idAuthentificationConseiller: 'id-auth-conseiller',
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

        notifierNouveauxMessagesExterne.execute
          .withArgs({
            idAuthentificationConseiller: 'id-auth-conseiller',
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
          .post(
            '/conseillers/pole-emploi/id-auth-conseiller/beneficiaires/notifier-message'
          )
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('quand le conseiller cible n’est pas Pôle emploi', () => {
      it('renvoie une 403 Forbidden', async () => {
        // Given
        const payload: EnvoyerNotificationsExternePayload = {
          idsAuthentificationBeneficiaires: ['id-auth-1', 'id-auth-2']
        }

        notifierNouveauxMessagesExterne.execute
          .withArgs({
            idAuthentificationConseiller: 'id-auth-conseiller',
            idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
          })
          .resolves(failure(new DroitsInsuffisants()))

        // When - Then
        await request(app.getHttpServer())
          .post(
            '/conseillers/pole-emploi/id-auth-conseiller/beneficiaires/notifier-message'
          )
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.FORBIDDEN)
      })
    })
  })
})
