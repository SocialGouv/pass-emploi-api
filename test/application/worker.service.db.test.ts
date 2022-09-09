import { WorkerService } from '../../src/application/worker.service.db'
import { expect, StubbedClass, stubClass } from '../utils'
import { HandleJobMailConseillerCommandHandler } from '../../src/application/commands/jobs/handle-job-mail-conseiller.command'
import { HandleJobRappelRendezVousCommandHandler } from '../../src/application/commands/jobs/handle-job-rappel-rendez-vous.command'
import { HandleNettoyerLesJobsCommandHandler } from '../../src/application/commands/jobs/handle-job-nettoyer-les-jobs.command'
import { HandleJobUpdateMailingListConseillerCommandHandler } from '../../src/application/commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from '../../src/application/commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from '../../src/application/commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { PlanificateurRedisRepository } from '../../src/infrastructure/repositories/planificateur-redis.repository.db'
import { testConfig } from '../utils/module-for-testing'
import { DateService } from '../../src/utils/date-service'
import { Planificateur } from '../../src/domain/planificateur'
import { HandleJobRecupererSituationsJeunesMiloCommandHandler } from 'src/application/commands/jobs/handle-job-recuperer-situations-jeunes-milo.command'
import { DatabaseForTesting } from '../utils/database-for-testing'
import { HandleJobNettoyerPiecesJointesCommandHandler } from 'src/application/commands/jobs/handle-job-nettoyer-pieces-jointes.command'
import { HandleJobNettoyerArchivesJeunesCommandHandler } from 'src/application/commands/jobs/handle-job-nettoyer-les-archives-jeune.command'
import { HandleJobRappelActionCommandHandler } from 'src/application/commands/jobs/handle-job-rappel-action.command'
import { HandleJobNotifierRendezVousPECommandHandler } from 'src/application/commands/jobs/handle-job-notifier-rendez-vous-pe.command'
import { HandleJobMettreAJourCodesEvenementsCommandHandler } from '../../src/application/commands/jobs/handle-job-mettre-a-jour-codes-evenements.command'

describe('WorkerService', () => {
  DatabaseForTesting.prepare()
  describe('handler', () => {
    let handleNettoyerLesJobsCommandHandler: StubbedClass<HandleNettoyerLesJobsCommandHandler>

    beforeEach(async () => {
      // Given
      const planificateurRepository = new PlanificateurRedisRepository(
        testConfig(),
        new DateService()
      )
      await planificateurRepository.isQueueReady()

      const handlerJobRendezVousCommandHandler = stubClass(
        HandleJobRappelRendezVousCommandHandler
      )
      const handlerJobRappelActionCommandHandler = stubClass(
        HandleJobRappelActionCommandHandler
      )
      const handleJobMailConseillerCommandHandler = stubClass(
        HandleJobMailConseillerCommandHandler
      )
      const notifierNouvellesOffresEmploiCommandHandler = stubClass(
        HandleJobNotifierNouvellesOffresEmploiCommandHandler
      )
      handleNettoyerLesJobsCommandHandler = stubClass(
        HandleNettoyerLesJobsCommandHandler
      )
      const handleJobUpdateMailingListConseillerCommandHandler = stubClass(
        HandleJobUpdateMailingListConseillerCommandHandler
      )
      const handleJobNotifierNouveauxServicesCiviqueCommandHandler = stubClass(
        HandleJobNotifierNouveauxServicesCiviqueCommandHandler
      )
      const handleJobRecupererSituationsJeunesMiloCommandHandler = stubClass(
        HandleJobRecupererSituationsJeunesMiloCommandHandler
      )
      const handleJobNettoyerPiecesJointesCommandHandler = stubClass(
        HandleJobNettoyerPiecesJointesCommandHandler
      )
      const handleJobNettoyerArchivesJeunesCommandHandler = stubClass(
        HandleJobNettoyerArchivesJeunesCommandHandler
      )
      const handleJobNotifierRendezVousPECommandHandler = stubClass(
        HandleJobNotifierRendezVousPECommandHandler
      )
      const handleJobMettreAJourCodesEvenementsCommandHandler = stubClass(
        HandleJobMettreAJourCodesEvenementsCommandHandler
      )
      const workerService = new WorkerService(
        planificateurRepository,
        handlerJobRendezVousCommandHandler,
        handlerJobRappelActionCommandHandler,
        handleJobMailConseillerCommandHandler,
        notifierNouvellesOffresEmploiCommandHandler,
        handleNettoyerLesJobsCommandHandler,
        handleJobUpdateMailingListConseillerCommandHandler,
        handleJobNotifierNouveauxServicesCiviqueCommandHandler,
        handleJobRecupererSituationsJeunesMiloCommandHandler,
        handleJobNettoyerPiecesJointesCommandHandler,
        handleJobNettoyerArchivesJeunesCommandHandler,
        handleJobNotifierRendezVousPECommandHandler,
        handleJobMettreAJourCodesEvenementsCommandHandler
      )

      workerService.subscribe()

      // When
      const job: Planificateur.Job = {
        date: new Date(),
        type: Planificateur.CronJob.NETTOYER_LES_JOBS,
        contenu: { message: 'my test dummy job' }
      }
      await planificateurRepository.createJob(job)
    })

    it('exécute la commande idoine', done => {
      // Then
      setTimeout(() => {
        expect(
          handleNettoyerLesJobsCommandHandler.execute
        ).to.have.been.calledWith()
        done()
      }, 2000)
    })
  })
})
