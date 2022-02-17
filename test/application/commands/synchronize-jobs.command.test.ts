import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SynchronizeJobsCommandHandler } from '../../../src/application/commands/synchronize-jobs.command'
import {
  Planificateur,
  PlanificateurService
} from '../../../src/domain/planificateur'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('SynchronizeJobsCommandHandler', () => {
  let synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let planificateurService: StubbedClass<PlanificateurService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)
    planificateurService = stubClass(PlanificateurService)

    synchronizeJobsCommandHandler = new SynchronizeJobsCommandHandler(
      rendezVousRepository,
      planificateurService,
      planificateurRepository
    )
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      rendezVousRepository.getAllAVenir.resolves([unRendezVous()])

      // WHen
      await synchronizeJobsCommandHandler.handle({})
    })
    it('supprime tous les jobs', async () => {
      // Then
      expect(planificateurRepository.supprimerTousLesJobs).to.have.callCount(1)
    })

    it('planifie les jobs de rendez-vous', async () => {
      // Then
      expect(
        planificateurService.planifierRappelsRendezVous
      ).to.have.been.calledWith(unRendezVous())
    })
  })
})
