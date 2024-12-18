import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { NotifierRendezVousPEJobHandler } from '../../../src/application/jobs/notifier-rendez-vous-pole-emploi.job.handler'
import { Notification } from '../../../src/domain/notification/notification'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneNotificationPoleEmploi } from '../../fixtures/notification.fixture'
import { Planificateur } from '../../../src/domain/planificateur'
import Type = Notification.Type
import JobType = Planificateur.JobType

describe('NotifierRendezVousPEJobHandler', () => {
  let sandbox: SinonSandbox
  let notifierRendezVousPEJobHandler: NotifierRendezVousPEJobHandler
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let dateService: StubbedClass<DateService>
  let notificationService: StubbedClass<Notification.Service>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let jeunePoleEmploiRepository: StubbedType<Jeune.PoleEmploi.Repository>

  const maintenant = uneDatetime()

  const jeune: Jeune = unJeune()
  const jeunePoleEmploi: Jeune.PoleEmploi = {
    id: jeune.id,
    idAuthentification: 'idAuthentification',
    pushNotificationToken: jeune.configuration.pushNotificationToken!
  }

  beforeEach(async () => {
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)
    dateService = stubClass(DateService)
    jeunePoleEmploiRepository = stubInterface(sandbox)
    notificationService = stubClass(Notification.Service)
    suiviJobService = stubInterface(sandbox)

    dateService.now.returns(maintenant)
    jeunePoleEmploiRepository.findAll.resolves([jeunePoleEmploi])

    notifierRendezVousPEJobHandler = new NotifierRendezVousPEJobHandler(
      poleEmploiClient,
      notificationService,
      dateService,
      suiviJobService,
      jeunePoleEmploiRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('traite les notifications PE des deux dernières heures seulement', async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPoleEmploi: Notification.PoleEmploi[] = [
        {
          idExterneDE: jeunePoleEmploi.idAuthentification,
          notifications: [
            {
              idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message:
                'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
              typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.minus({ hour: 1 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.minus({ hour: 3 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 14/02/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.plus({ hour: 1 }),
              idMetier: 'idMetier1'
            }
          ]
        }
      ]
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .resolves(notificationsPoleEmploi)

      // When
      const result = await notifierRendezVousPEJobHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).to.have.been.calledOnceWithExactly(
        Notification.Type.NEW_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        jeunePoleEmploi.id,
        'idMetier1'
      )

      const suiviJob: SuiviJob = {
        dateExecution: maintenant,
        jobType: JobType.NOTIFIER_RENDEZVOUS_PE,
        nbErreurs: 0,
        resultat: {
          erreurs: 0,
          jeunesPEAvecToken: 1,
          nombreJeunesTraites: 1,
          nombreNotificationsDoublons: 0,
          nombreNotificationsEnvoyees: 1
        },
        succes: true,
        tempsExecution: 84658021585
      }
      expect(result).excluding('tempsExecution').to.deep.equal(suiviJob)
    })
    it('traite les notifications PE à minuit', async () => {
      // Given
      const dateMinuit = DateTime.fromISO('2020-04-06T00:30:00.000')
      dateService.now.returns(dateMinuit)

      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPartenairesPE: Notification.PoleEmploi[] = [
        {
          idExterneDE: jeunePoleEmploi.idAuthentification,
          notifications: [
            {
              idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message:
                'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
              typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ hour: 1 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 11:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ minutes: 20 })
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ hour: 3 }),
              idMetier: 'idMetier3'
            },
            {
              idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 08:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.plus({ hour: 1 }),
              idMetier: 'idMetier4'
            }
          ]
        }
      ]
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .resolves(notificationsPartenairesPE)

      // When
      const result = await notifierRendezVousPEJobHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).to.have.been.calledTwice()
      expect(
        notificationService.notifierUnRendezVousPoleEmploi.getCall(0).args
      ).to.deep.equal([
        Notification.Type.NEW_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        jeunePoleEmploi.id,
        'idMetier1'
      ])
      expect(
        notificationService.notifierUnRendezVousPoleEmploi.getCall(1).args
      ).to.deep.equal([
        Notification.Type.DELETED_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Le rendez-vous du 06/09/2022 11:30 a été supprimé',
        jeunePoleEmploi.id,
        undefined
      ])

      const suiviJob: SuiviJob = {
        dateExecution: dateMinuit,
        jobType: JobType.NOTIFIER_RENDEZVOUS_PE,
        nbErreurs: 0,
        resultat: {
          jeunesPEAvecToken: 1,
          nombreJeunesTraites: 1,
          nombreNotificationsEnvoyees: 2,
          nombreNotificationsDoublons: 0,
          erreurs: 0
        },
        succes: true,
        tempsExecution: 84658021585
      }
      expect(result).excluding('tempsExecution').to.deep.equal(suiviJob)
    })
    it("catch l'erreur d'appel api", async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .rejects()

      // When
      const result = await notifierRendezVousPEJobHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).not.to.have.been.called()

      const suiviJob: SuiviJob = {
        dateExecution: maintenant,
        jobType: JobType.NOTIFIER_RENDEZVOUS_PE,
        nbErreurs: 1,
        resultat: {
          jeunesPEAvecToken: 1,
          nombreJeunesTraites: 0,
          nombreNotificationsEnvoyees: 0,
          nombreNotificationsDoublons: 0,
          erreurs: 1
        },
        succes: true,
        tempsExecution: 84658021585
      }
      expect(result).excluding('tempsExecution').to.deep.equal(suiviJob)
    })

    describe('filtrage des notifications', () => {
      const dateMinuit = DateTime.fromISO('2020-04-06T00:30:00.000Z')
      const notificationNouveauRendezVous = uneNotificationPoleEmploi({
        idMetier: 'idMetier1',
        typeMouvementRDV: Type.NEW_RENDEZVOUS,
        dateCreation: dateMinuit.minus({ hour: 1 }),
        message: "C'est un nouveau rendez-vous"
      })
      const notificationRendezVousMisAJour = uneNotificationPoleEmploi({
        idMetier: 'idMetier1',
        typeMouvementRDV: Type.UPDATED_RENDEZVOUS,
        dateCreation: dateMinuit.minus({ hour: 1 }),
        message: "C'est une mise à jour de rendez-vous"
      })
      const notificationRendezVousSupprime = uneNotificationPoleEmploi({
        idMetier: 'idMetier1',
        typeMouvementRDV: Type.DELETED_RENDEZVOUS,
        dateCreation: dateMinuit.minus({ hour: 1 })
      })

      beforeEach(() => {
        dateService.now.returns(dateMinuit)
      })

      describe('quand il y a une création et un update pour un rendez-vous', () => {
        it("n'envoie que la création", async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [
                notificationNouveauRendezVous,
                notificationRendezVousMisAJour
              ]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).to.have.been.calledOnceWithExactly(
            notificationNouveauRendezVous.typeMouvementRDV,
            jeunePoleEmploi.pushNotificationToken,
            notificationRendezVousMisAJour.message,
            jeunePoleEmploi.id,
            notificationNouveauRendezVous.idMetier
          )
        })
      })
      describe('quand il y a une création et un delete pour un rendez-vous', () => {
        it("n'envoie rien", async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [
                notificationRendezVousSupprime,
                notificationNouveauRendezVous
              ]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).not.to.have.been.called()
        })
      })
      describe('quand il y a une update et un delete pour un rendez-vous', () => {
        it("n'envoie rien", async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [
                notificationRendezVousSupprime,
                notificationRendezVousMisAJour
              ]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).not.to.have.been.called()
        })
      })
      describe('quand il y a un update', () => {
        it('envoie une notification de mise à jour', async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [notificationRendezVousMisAJour]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).to.have.been.calledWithExactly(
            notificationRendezVousMisAJour.typeMouvementRDV,
            jeunePoleEmploi.pushNotificationToken,
            notificationRendezVousMisAJour.message,
            jeunePoleEmploi.id,
            notificationRendezVousMisAJour.idMetier
          )
        })
      })
      describe('quand il y a deux updates', () => {
        it('envoie une seule notification de mise à jour', async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [
                notificationRendezVousMisAJour,
                notificationRendezVousMisAJour
              ]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).to.have.been.calledWithExactly(
            notificationRendezVousMisAJour.typeMouvementRDV,
            jeunePoleEmploi.pushNotificationToken,
            notificationRendezVousMisAJour.message,
            jeunePoleEmploi.id,
            notificationRendezVousMisAJour.idMetier
          )
        })
      })
      describe('quand il y a un delete', () => {
        it('envoie une notification de suppression', async () => {
          // Given
          const notificationsPoleEmploi: Notification.PoleEmploi[] = [
            {
              idExterneDE: jeunePoleEmploi.idAuthentification,
              notifications: [notificationRendezVousSupprime]
            }
          ]
          poleEmploiClient.getNotificationsRendezVous.resolves(
            notificationsPoleEmploi
          )

          // When
          await notifierRendezVousPEJobHandler.handle()

          // Then
          expect(
            notificationService.notifierUnRendezVousPoleEmploi
          ).to.have.been.calledWithExactly(
            notificationRendezVousSupprime.typeMouvementRDV,
            jeunePoleEmploi.pushNotificationToken,
            notificationRendezVousSupprime.message,
            jeunePoleEmploi.id,
            notificationRendezVousSupprime.idMetier
          )
        })
      })
    })
  })
})
