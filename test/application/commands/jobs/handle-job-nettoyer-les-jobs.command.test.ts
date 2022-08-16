import { HandleNettoyerLesJobsCommandHandler } from '../../../../src/application/commands/jobs/handle-job-nettoyer-les-jobs.command'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Planificateur } from '../../../../src/domain/planificateur'
import { NotificationSupport } from '../../../../src/domain/notification-support'
import { DateService } from '../../../../src/utils/date-service'

describe('HandleNettoyerLesJobsCommandHandler', () => {
  describe('handle', () => {
    it('nettoie', () => {
      // Given
      const sandbox: SinonSandbox = createSandbox()
      const planificateurRepository: StubbedType<Planificateur.Repository> =
        stubInterface(sandbox)
      const dateService: StubbedClass<DateService> = stubClass(DateService)
      const notificationSupportRepository: StubbedType<NotificationSupport.Service> =
        stubInterface(sandbox)
      const handleNettoyerLesJobsCommandHandler =
        new HandleNettoyerLesJobsCommandHandler(
          planificateurRepository,
          dateService,
          notificationSupportRepository
        )

      // When
      handleNettoyerLesJobsCommandHandler.handle()

      // Then
      expect(planificateurRepository.supprimerLesAnciensJobs).to.have.callCount(
        1
      )
    })
  })
})
