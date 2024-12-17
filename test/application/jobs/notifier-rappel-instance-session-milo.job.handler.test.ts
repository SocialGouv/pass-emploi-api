import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { NotifierRappelInstanceSessionMiloJobHandler } from '../../../src/application/jobs/notifier-rappel-instance-session-milo.job.handler'
import { JeuneMilo } from '../../../src/domain/milo/jeune.milo'
import { SessionMilo } from '../../../src/domain/milo/session.milo'
import { Notification } from '../../../src/domain/notification/notification'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { DateService } from '../../../src/utils/date-service'
import { unJeune, uneConfiguration } from '../../fixtures/jeune.fixture'
import { uneInstanceSessionMilo } from '../../fixtures/milo.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'
import { success } from '../../../src/building-blocks/types/result'

const MILO_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

describe('handler', () => {
  let handler: NotifierRappelInstanceSessionMiloJobHandler
  let sessionRepository: StubbedType<SessionMilo.Repository>
  let jeuneRepository: StubbedType<JeuneMilo.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  const today = DateTime.fromISO('2022-04-06T12:00:00.000Z')

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    sessionRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(today)

    handler = new NotifierRappelInstanceSessionMiloJobHandler(
      suiviJobService,
      sessionRepository,
      jeuneRepository,
      notificationRepository,
      dateSevice
    )
  })

  const job: Planificateur.Job<Planificateur.JobRappelSession> = {
    type: Planificateur.JobType.RENDEZVOUS,
    contenu: {
      idSession: 'idSession',
      idDossier: 'idDossier',
      idInstance: 'idInstance'
    },
    dateExecution: uneDatetime().toJSDate()
  }

  describe("quand l'instance de session n'existe pas", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      sessionRepository.findInstanceSession.resolves(undefined)

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe("quand le jeune n'a pas de pushNotificationToken", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const instance = uneInstanceSessionMilo()
      const jeuneSansToken: JeuneMilo = {
        ...unJeune({
          configuration: uneConfiguration({ pushNotificationToken: undefined })
        }),
        idStructureMilo: '1241'
      }
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneSansToken))

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.callCount(0)
    })
  })

  describe("quand l'instance de session est demain", () => {
    it('envoie une notification pour demain', async () => {
      // Given
      const instance = uneInstanceSessionMilo({
        dateHeureDebut: today.plus({ day: 1 }).toFormat(MILO_DATE_FORMAT)
      })
      const jeuneAvecToken: JeuneMilo = {
        ...unJeune(),
        idStructureMilo: '1241'
      }
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneAvecToken))

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.been.calledWith({
        token: 'token',
        notification: {
          title: 'Rappel session',
          body: 'Vous avez une session demain'
        },
        data: {
          type: 'DETAIL_SESSION_MILO',
          id: job.contenu.idSession
        }
      })
    })
  })
  describe("quand l'instance de session est dans 7 jours", () => {
    it('envoie une notification pour la semaine prochaine', async () => {
      // Given
      const instance = uneInstanceSessionMilo({
        dateHeureDebut: today.plus({ day: 7 }).toFormat(MILO_DATE_FORMAT)
      })
      const jeuneAvecToken: JeuneMilo = {
        ...unJeune(),
        idStructureMilo: '1241'
      }
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneAvecToken))

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).to.have.been.calledWithExactly(
        {
          token: 'token',
          notification: {
            title: 'Rappel session',
            body: 'Vous avez une session dans une semaine'
          },
          data: {
            type: 'DETAIL_SESSION_MILO',
            id: job.contenu.idSession
          }
        },
        jeuneAvecToken.id
      )
    })
  })
  describe("l'instance de session est dans moins d'une semaine et plus d'un jour", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const instance = uneInstanceSessionMilo({
        dateHeureDebut: today.plus({ day: 5 }).toFormat(MILO_DATE_FORMAT)
      })
      const jeuneAvecToken: JeuneMilo = {
        ...unJeune(),
        idStructureMilo: '1241'
      }
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneAvecToken))
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).not.to.have.been.called()
    })
  })
  describe("quand l'instance de session est passée", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const instance = uneInstanceSessionMilo({
        dateHeureDebut: today.minus({ day: 1 }).toFormat(MILO_DATE_FORMAT)
      })
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)
      const jeuneAvecToken: JeuneMilo = {
        ...unJeune(),
        idStructureMilo: '1241'
      }
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneAvecToken))

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).not.to.have.been.called()
    })
  })
  describe("quand l'instance de session est dans plus de 7 jours", () => {
    it("n'envoie pas de notification", async () => {
      // Given
      const instance = uneInstanceSessionMilo({
        dateHeureDebut: today.plus({ day: 8 }).toFormat(MILO_DATE_FORMAT)
      })
      sessionRepository.findInstanceSession
        .withArgs(job.contenu.idInstance)
        .resolves(instance)
      const jeuneAvecToken: JeuneMilo = {
        ...unJeune(),
        idStructureMilo: '1241'
      }
      jeuneRepository.getByIdDossier
        .withArgs(job.contenu.idDossier)
        .resolves(success(jeuneAvecToken))

      // When
      await handler.handle(job)

      // Then
      expect(notificationRepository.send).not.to.have.been.called()
    })
  })
})
