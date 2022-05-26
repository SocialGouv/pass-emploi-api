import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import {
  HandleJobRappelRendezVousCommand,
  HandleJobRappelRendezVousCommandHandler
} from '../../../../src/application/commands/jobs/handle-job-rappel-rendez-vous.command'
import { Planificateur } from '../../../../src/domain/planificateur'
import { RendezVous } from '../../../../src/domain/rendez-vous'
import { Notification } from '../../../../src/domain/notification'
import { DateService } from '../../../../src/utils/date-service'
import { unRendezVous } from '../../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { uneDatetime } from 'test/fixtures/date.fixture'

describe('HandlerJobRendezVousCommandHandler', () => {
  let handlerJobRendezVousCommandHandler: HandleJobRappelRendezVousCommandHandler
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

    handlerJobRendezVousCommandHandler =
      new HandleJobRappelRendezVousCommandHandler(
        rendezVousRepository,
        notificationRepository,
        dateSevice
      )
  })

  const command: HandleJobRappelRendezVousCommand = {
    job: {
      type: Planificateur.JobEnum.RENDEZVOUS,
      contenu: {
        idRendezVous: 'idRendezVous'
      },
      date: uneDatetime.toJSDate()
    }
  }

  describe("quand le rendez-vous n'existe pas", () => {
    it("n'envoie pas de notification", async () => {
      // Given
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
      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous()
      }
      unRendezVousSansToken.jeunes[0].pushNotificationToken = undefined
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
          body: 'Vous avez un rendez-vous demain'
        },
        data: {
          type: 'RAPPEL_RENDEZVOUS',
          id: 'idRendezVous'
        }
      })
    })
  })
  describe('quand le rendez-vous est dans 7 jours', () => {
    it('envoie une notification pour la semaine prochaine', async () => {
      // Given
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
          body: 'Vous avez un rendez-vous dans une semaine'
        },
        data: {
          type: 'RAPPEL_RENDEZVOUS',
          id: 'idRendezVous'
        }
      })
    })
  })
  describe("le rendez-vous est dans moins d'une semaine et plus d'un jour", () => {
    it('envoie une notification avec le nombre de jours', async () => {
      // Given
      const unRendezVousSansToken: RendezVous = {
        ...unRendezVous(),
        date: today.plus({ day: 5 }).toJSDate()
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
          body: 'Vous avez un rendez-vous dans 5 jours'
        },
        data: {
          type: 'RAPPEL_RENDEZVOUS',
          id: 'idRendezVous'
        }
      })
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
        .withArgs(command.job.contenu.idRendezVous)
        .resolves(unRendezVousSansToken)

      // When
      await handlerJobRendezVousCommandHandler.handle(command)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })
})
