import { HandleNettoyerLesJobsCommandHandler } from '../../../src/application/cron-jobs/handle-job-nettoyer-les-jobs.command'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { DateService } from '../../../src/utils/date-service'

describe('HandleNettoyerLesJobsCommandHandler', () => {
  describe('handle', () => {
    it('nettoie', () => {
      // Given
      const sandbox: SinonSandbox = createSandbox()
      const planificateurRepository: StubbedType<Planificateur.Repository> =
        stubInterface(sandbox)
      const dateService: StubbedClass<DateService> = stubClass(DateService)
      const suiviJobRepository: StubbedType<SuiviJob.Service> =
        stubInterface(sandbox)
      const handleNettoyerLesJobsCommandHandler =
        new HandleNettoyerLesJobsCommandHandler(
          planificateurRepository,
          dateService,
          suiviJobRepository
        )

      // When
      handleNettoyerLesJobsCommandHandler.handle()

      // Then
      expect(planificateurRepository.supprimerLesJobsPasses).to.have.callCount(
        1
      )
    })
  })
})
