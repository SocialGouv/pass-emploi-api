import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { SynchronizeJobsCommandHandler } from '../../../../src/application/commands/tasks/synchronize-jobs.command'
import {
  Planificateur,
  PlanificateurService
} from '../../../../src/domain/planificateur'
import { RendezVous } from '../../../../src/domain/rendez-vous'
import { Action } from '../../../../src/domain/action'
import { unRendezVous } from '../../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { uneAction } from '../../../fixtures/action.fixture'
import { emptySuccess } from '../../../../src/building-blocks/types/result'

describe('SynchronizeJobsCommandHandler', () => {
  DatabaseForTesting.prepare()
  let synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let actionRepository: StubbedType<Action.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let planificateurService: StubbedClass<PlanificateurService>
  let actionFactory: StubbedClass<Action.Factory>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    actionRepository = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)
    planificateurService = stubClass(PlanificateurService)
    actionFactory = stubClass(Action.Factory)

    synchronizeJobsCommandHandler = new SynchronizeJobsCommandHandler(
      rendezVousRepository,
      actionRepository,
      planificateurService,
      planificateurRepository,
      actionFactory
    )
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      rendezVousRepository.getAllAVenir.resolves([unRendezVous()])
      actionRepository.findAllActionsARappeler.resolves([uneAction()])
      actionFactory.doitEnvoyerUneNotificationDeRappel
        .withArgs(uneAction())
        .returns(emptySuccess())

      // WHen
      await synchronizeJobsCommandHandler.handle()
    })
    it('supprime tous les jobs', async () => {
      // Then
      expect(planificateurRepository.supprimerTousLesJobs).to.have.callCount(1)
    })

    it('planifie les jobs de rappels de rendez-vous', async () => {
      // Then
      expect(
        planificateurService.planifierRappelsRendezVous
      ).to.have.been.calledWith(unRendezVous())
    })

    it("planifie les jobs de rappels d'actions", async () => {
      // Then
      expect(
        planificateurService.planifierRappelAction
      ).to.have.been.calledWith(uneAction())
    })
  })
})
