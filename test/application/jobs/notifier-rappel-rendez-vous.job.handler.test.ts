import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { NotifierRappelRendezVousJobHandler } from '../../../src/application/jobs/notifier-rappel-rendez-vous.job.handler'
import { Planificateur } from '../../../src/domain/planificateur'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import { Notification } from '../../../src/domain/notification/notification'
import { DateService } from '../../../src/utils/date-service'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { SuiviJob } from '../../../src/domain/suivi-job'

describe('HandlerJobRendezVousCommandHandler', () => {
  let handlerJobRendezVousCommandHandler: NotifierRappelRendezVousJobHandler
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  const today = DateTime.fromISO('2022-04-06T12:00:00.000Z')

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(today)

    handlerJobRendezVousCommandHandler = new NotifierRappelRendezVousJobHandler(
      suiviJobService,
      rendezVousRepository,
      notificationRepository,
      dateSevice
    )
  })

  const job: Planificateur.Job<Planificateur.JobRendezVous> = {
    type: Planificateur.JobType.RENDEZVOUS,
    contenu: {
      idRendezVous: 'idRendezVous'
    },
    dateExecution: uneDatetime().toJSDate()
  }

  describe("quand le rendez-vous n'existe pas", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(undefined)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe("quand le jeune n'a pas de pushNotificationToken", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous()
      }
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe('quand le rendez-vous est demain', () => {
    it('envoie une notification pour demain', async () => {
      // Given
      const rendezVous: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 1 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(rendezVous)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.been.calledWith(
        {
          token: 'token',
          notification: {
            title: 'Rappel rendez-vous',
            body: 'Vous avez un rendez-vous demain'
          },
          data: {
            type: 'RAPPEL_RENDEZVOUS',
            id: 'idRendezVous'
          }
        },
        rendezVous.jeunes[0].id
      )
    })
  })
  describe('quand le rendez-vous est dans 7 jours', () => {
    it('envoie une notification pour la semaine prochaine', async () => {
      // Given
      const rendezVous: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 7 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(rendezVous)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.been.calledWithExactly(
        {
          token: 'token',
          notification: {
            title: 'Rappel rendez-vous',
            body: 'Vous avez un rendez-vous dans une semaine'
          },
          data: {
            type: 'RAPPEL_RENDEZVOUS',
            id: 'idRendezVous'
          }
        },
        rendezVous.jeunes[0].id
      )
    })
  })
  describe("le rendez-vous est dans moins d'une semaine et plus d'un jour", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 5 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).not.to.have.been.called()
    })
  })
  describe('quand le rendez-vous est passé', () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous(),
        date: today.minus({ day: 1 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(job)

      // Then
      expect(notificationRepository.send).not.to.have.been.called()
    })
  })
})
