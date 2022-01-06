import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import {
  HandleJobRendezVousCommand,
  HandleJobRendezVousCommandHandler
} from '../../../src/application/commands/handle-job-rendez-vous.command'
import { Planificateur } from '../../../src/domain/planificateur'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification'
import { DateService } from '../../../src/utils/date-service'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('HandlerJobRendezVousCommandHandler', () => {
  let handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let dateSevice: StubbedClass<DateService>
  const today = DateTime.fromISO('2022-04-06T12:00:00.000Z').toUTC()

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(today)

    handlerJobRendezVousCommandHandler = new HandleJobRendezVousCommandHandler(
      rendezVousRepository,
      notificationRepository,
      dateSevice
    )
  })

  describe("quand le rendez-vous n'existe pas", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const command: HandleJobRendezVousCommand = {
        job: {
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'idRendezVous'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }
      rendezVousRepository.get
        .withArgs(command.job.contenu.idRendezVous)
        .resolves(undefined)

      // When
      await handlerJobRendezVousCommandHandler.handle(command)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe("quand le jeune n'a pas de token", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const command: HandleJobRendezVousCommand = {
        job: {
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'idRendezVous'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }

      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous()
      }
      unRendezVousSansToken.jeune.pushNotificationToken = undefined
      rendezVousRepository.get
        .withArgs(command.job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(command)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe('quand le rendez-vous est demain', () => {
    it('envoie une notification pour demain', async () => {
      // Given
      const command: HandleJobRendezVousCommand = {
        job: {
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'idRendezVous'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }

      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 1 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(command.job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(command)

      // Then
      expect(notificationRepository.send).to.have.been.calledWith({
        token: 'unToken',
        notification: {
          title: 'Rappel rendez-vous',
          body: 'Vous avez rendez-vous demain à 14h00'
        },
        data: {
          type: 'RAPPEL_RENDEZVOUS',
          id: 'idRendezVous',
          date: DateTime.fromJSDate(unRendezVousSansToken.date).toUTC().toISO()
        }
      })
    })
  })

  describe('quand le rendez-vous est dans 7 jours', () => {
    it('envoie une notification pour la semaine prochaine', async () => {
      // Given
      const command: HandleJobRendezVousCommand = {
        job: {
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'idRendezVous'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }

      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 7 }).toJSDate()
      }
      rendezVousRepository.get
        .withArgs(command.job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(command)

      // Then
      expect(notificationRepository.send).to.have.been.calledWithExactly({
        token: 'unToken',
        notification: {
          title: 'Rappel rendez-vous',
          body: 'Vous avez rendez-vous le mercredi 13 avril à 14h00'
        },
        data: {
          type: 'RAPPEL_RENDEZVOUS',
          id: 'idRendezVous',
          date: DateTime.fromJSDate(unRendezVousSansToken.date).toUTC().toISO()
        }
      })
    })
  })
})
