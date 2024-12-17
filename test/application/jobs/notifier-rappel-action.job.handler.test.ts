import { NotifierRappelActionJobHandler } from '../../../src/application/jobs/notifier-rappel-action.job.handler'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Notification } from '../../../src/domain/notification/notification'
import { expect, StubbedClass, stubClass } from '../../utils'
import { createSandbox } from 'sinon'
import { Planificateur } from '../../../src/domain/planificateur'
import { Action } from '../../../src/domain/action/action'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneAction } from '../../fixtures/action.fixture'
import {
  desPreferencesJeune,
  uneConfiguration
} from '../../fixtures/jeune.fixture'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { PasDeRappelError } from '../../../src/building-blocks/types/domain-error'
import { DateService } from '../../../src/utils/date-service'
import { SuiviJob } from '../../../src/domain/suivi-job'

describe('NotifierRappelActionJobHandler', () => {
  let notifierRappelActionJobHandler: NotifierRappelActionJobHandler
  let actionRepository: StubbedType<Action.Repository>
  let jeuneConfigurationApplicationRepository: StubbedType<Jeune.ConfigurationApplication.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let actionFactory: StubbedClass<Action.Factory>
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(() => {
    const sandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    jeuneConfigurationApplicationRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    actionFactory = stubClass(Action.Factory)
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    notifierRappelActionJobHandler = new NotifierRappelActionJobHandler(
      actionRepository,
      jeuneConfigurationApplicationRepository,
      notificationRepository,
      actionFactory,
      suiviJobService,
      dateService
    )
  })

  describe('handle', () => {
    const action = uneAction()
    const job: Planificateur.Job<Planificateur.JobRappelAction> = {
      type: Planificateur.JobType.RAPPEL_ACTION,
      dateExecution: uneDatetime().toJSDate(),
      contenu: {
        idAction: action.id
      }
    }

    describe('quand il faut envoyer un rappel', () => {
      describe('quand le jeune a un push token', () => {
        it('envoie un rappel quand activé', async () => {
          // Given
          actionRepository.get.withArgs(action.id).resolves(action)
          actionFactory.doitEnvoyerUneNotificationDeRappel
            .withArgs(action)
            .returns(emptySuccess())
          jeuneConfigurationApplicationRepository.get
            .withArgs(action.idJeune)
            .resolves(uneConfiguration({ preferences: desPreferencesJeune() }))

          // When
          const result = await notifierRappelActionJobHandler.handle(job)

          // Then
          expect(result.succes).to.equal(true)
          expect(result.resultat).to.deep.equal({
            idAction: action.id,
            idJeune: action.idJeune,
            notificationEnvoyee: true
          })

          expect(notificationRepository.send).to.have.been.calledWithExactly(
            {
              token: uneConfiguration().pushNotificationToken,
              notification: {
                title: 'Rappel action',
                body: 'Une action arrive à échéance dans 3 jours'
              },
              data: {
                type: 'DETAIL_ACTION',
                id: action.id
              }
            },
            action.idJeune
          )
        })
        it('pas de rappel quand desactivé', async () => {
          // Given
          actionRepository.get.withArgs(action.id).resolves(action)
          actionFactory.doitEnvoyerUneNotificationDeRappel
            .withArgs(action)
            .returns(emptySuccess())
          jeuneConfigurationApplicationRepository.get
            .withArgs(action.idJeune)
            .resolves(
              uneConfiguration({
                preferences: desPreferencesJeune({ rappelActions: false })
              })
            )

          // When
          const result = await notifierRappelActionJobHandler.handle(job)

          // Then
          expect(result.succes).to.equal(true)
          expect(result.resultat).to.deep.equal({
            idAction: action.id,
            idJeune: action.idJeune,
            notificationEnvoyee: false
          })

          expect(notificationRepository.send).not.to.have.been.called()
        })
      })
      describe("quand le jeune n'a pas de push token", () => {
        it("n'envoie pas de rappel", async () => {
          // Given
          actionRepository.get.withArgs(action.id).resolves(action)
          actionFactory.doitEnvoyerUneNotificationDeRappel
            .withArgs(action)
            .returns(emptySuccess())
          jeuneConfigurationApplicationRepository.get
            .withArgs(action.idJeune)
            .resolves({
              idJeune: action.idJeune,
              pushNotificationToken: undefined
            })

          // When
          const result = await notifierRappelActionJobHandler.handle(job)

          // Then
          expect(result.succes).to.equal(true)
          expect(result.resultat).to.deep.equal({
            idAction: action.id,
            idJeune: action.idJeune,
            notificationEnvoyee: false
          })
          expect(notificationRepository.send).not.to.have.been.called()
        })
      })
    })
    describe('quand il ne faut pas envoyer de rappel', () => {
      it("n'envoie pas de rappel", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(action)
        actionFactory.doitEnvoyerUneNotificationDeRappel
          .withArgs(action)
          .returns(
            failure(
              new PasDeRappelError(
                action.id,
                `l'action n'arrive pas à échéance dans 3 jours`
              )
            )
          )

        // When
        const result = await notifierRappelActionJobHandler.handle(job)

        // Then
        expect(result.succes).to.equal(true)
        expect(result.resultat).to.deep.equal({
          idAction: '721e2108-60f5-4a75-b102-04fe6a40e899',
          notificationEnvoyee: false,
          raison:
            "Pas de rappel à envoyer pour l'action 721e2108-60f5-4a75-b102-04fe6a40e899 car l'action n'arrive pas à échéance dans 3 jours"
        })
        expect(notificationRepository.send).not.to.have.been.called()
      })
    })

    describe("quand l'action n'existe pas", () => {
      it("n'envoie pas de rappel", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(undefined)

        // When
        const result = await notifierRappelActionJobHandler.handle(job)

        // Then
        expect(result.succes).to.equal(true)
        expect(result.resultat).to.deep.equal({
          notificationEnvoyee: false
        })
        expect(notificationRepository.send).not.to.have.been.called()
      })
    })
  })
})
