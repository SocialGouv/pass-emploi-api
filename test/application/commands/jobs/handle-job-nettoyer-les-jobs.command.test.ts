import { HandleNettoyerLesJobsCommandHandler } from '../../../../src/application/commands/jobs/handle-job-nettoyer-les-jobs.command'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect } from '../../../utils'
import { Planificateur } from '../../../../src/domain/planificateur'

describe('HandleNettoyerLesJobsCommandHandler', () => {
  describe('handle', () => {
    it('nettoie', () => {
      // Given
      const sandbox: SinonSandbox = createSandbox()
      const planificateurRepository: StubbedType<Planificateur.Repository> =
        stubInterface(sandbox)
      const handleNettoyerLesJobsCommandHandler =
        new HandleNettoyerLesJobsCommandHandler(planificateurRepository)

      // When
      handleNettoyerLesJobsCommandHandler.handle({})

      // Then
      expect(planificateurRepository.supprimerLesAnciensJobs).to.have.callCount(
        1
      )
    })
  })
})
